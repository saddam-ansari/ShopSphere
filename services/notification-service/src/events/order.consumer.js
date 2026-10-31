
import { getChannel } from "../config/rabbitmq.js";
import { sendEmail } from "../utils/email.service.js";

import {
    findNotificationByEventId,
    createNotificationLog,
    updateNotificationStatus,
    claimFailedNotification,
    claimStaleNotification,
} from "../repositories/notification.repository.js";

const EXCHANGE_NAME = "shopsphere.events";
const QUEUE_NAME = "notification-service.order-events";

const RETRY_EXCHANGE = "notification-service.retry";
const DLX_EXCHANGE = "notification-service.dlx";

const MAX_RETRIES = 3;

// Publish a message and wait for RabbitMQ confirmation.
const publishConfirmed = (
    channel,
    exchange,
    routingKey,
    content,
    options
) => {
    return new Promise((resolve, reject) => {
        channel.publish(
            exchange,
            routingKey,
            content,
            options,
            (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            }
        );
    });
};

// Main RabbitMQ consumer.
export const startOrderConsumer = async () => {
    const channel = getChannel();

    await channel.assertExchange(EXCHANGE_NAME, "topic", {
        durable: true,
    });

    await channel.bindQueue(
        QUEUE_NAME,
        EXCHANGE_NAME,
        "order.created"
    );

    await channel.bindQueue(
        QUEUE_NAME,
        EXCHANGE_NAME,
        "order.status.updated"
    );

    await channel.bindQueue(
        QUEUE_NAME,
        EXCHANGE_NAME,
        "order.retry"
    );

    // Process one unacknowledged message at a time per channel.
    await channel.prefetch(1);

    console.log("RabbitMQ prefetch limit set to 1");
    console.log("Notification Service listening for order events");

    await channel.consume(
        QUEUE_NAME,
        async (message) => {
            if (!message) return;

            let eventId = null;

            try {
                // Parse RabbitMQ message.
                const event = JSON.parse(
                    message.content.toString()
                );

                const eventType = event.eventType ?? event.event;
                const data = event.data ?? {};

                const {
                    orderId,
                    customerEmail,
                } = data;

                // Read unique event ID.
                eventId =
                    event.eventId ??
                    message.properties.messageId;

                if (!eventId) {
                    throw new Error(
                        "Event ID is missing from message"
                    );
                }

                // Validate required event data.
                if (!orderId || !customerEmail) {
                    console.error(
                        "Invalid order event. Missing orderId or customerEmail."
                    );

                    await publishConfirmed(
                        channel,
                        DLX_EXCHANGE,
                        "notification.failed",
                        message.content,
                        {
                            persistent: true,
                            contentType: "application/json",
                            headers: {
                                ...(message.properties.headers ?? {}),
                                "failure-reason":
                                    "Missing orderId or customerEmail",
                            },
                            messageId: message.properties.messageId,
                        }
                    );

                    console.log(
                        "Invalid event moved directly to Dead Letter Queue"
                    );

                    channel.ack(message);
                    return;
                }

                // Validate supported event types.
                if (
                    eventType !== "order.created" &&
                    eventType !== "order.status.updated"
                ) {
                    throw new Error(
                        `Unsupported event type: ${eventType}`
                    );
                }

                // Check PostgreSQL for an existing event.
                const existingNotification =
                    await findNotificationByEventId(eventId);

                // Already sent: do not send another email.
                if (existingNotification?.status === "SENT") {
                    console.log(
                        `Duplicate notification skipped: ${eventId}`
                    );

                    channel.ack(message);
                    return;
                }

                let claimedNotification = null;

                // First attempt: create a new notification record.
                if (!existingNotification) {
                    claimedNotification = await createNotificationLog({
                        eventId,
                        orderId,
                        eventType,
                        customerEmail,
                    });
                }

                // Retry: atomically claim an existing FAILED record.
                else if (existingNotification.status === "FAILED") {
                    claimedNotification =
                        await claimFailedNotification(eventId);
                }

                // Recover a notification stuck in PROCESSING for over 5 minutes.
                else if (existingNotification.status === "PROCESSING") {
                    claimedNotification =
                        await claimStaleNotification(eventId);
                }

                // Another consumer may already own this event.
                if (!claimedNotification) {
                    console.log(
                        `Notification is already being processed: ${eventId}`
                    );

                    channel.ack(message);
                    return;
                }

                // Send the appropriate email and capture its delivery details.
                let emailResult;

                if (eventType === "order.created") {
                    emailResult =
                        await sendOrderConfirmationEmail(data);

                } else if (eventType === "order.status.updated") {
                    emailResult =
                        await sendOrderStatusEmail(data);
                }

                if (!emailResult?.messageId) {
                    throw new Error(
                        "Email was sent without a delivery message ID"
                    );
                }

                // Save SENT status and Nodemailer message ID in PostgreSQL.
                await updateNotificationStatus(
                    eventId,
                    "SENT",
                    null,
                    emailResult.messageId
                );

                console.log(
                    `Notification recorded as SENT: ${eventId}`
                );

                console.log(
                    `Delivery Reference: ${emailResult.messageId}`
                );

                // Acknowledge only after PostgreSQL update succeeds.
                channel.ack(message);

            } catch (error) {
                console.error(
                    "Error processing order notification:",
                    error.message
                );

                try {
                    // Record the failed attempt in PostgreSQL.
                    if (eventId) {
                        await updateNotificationStatus(
                            eventId,
                            "FAILED",
                            error.message
                        );
                    }

                    // Read current retry count.
                    const headers =
                        message.properties.headers ?? {};

                    const retryCount = Number(
                        headers["x-retry-count"] ?? 0
                    );

                    const nextRetryCount = retryCount + 1;

                    const retryHeaders = {
                        ...headers,
                        "x-retry-count": nextRetryCount,
                    };

                    const options = {
                        persistent: true,
                        contentType:
                            message.properties.contentType ||
                            "application/json",
                        headers: retryHeaders,
                        messageId:
                            message.properties.messageId,
                        correlationId:
                            message.properties.correlationId,
                        type: message.properties.type,
                        appId: message.properties.appId,
                    };

                    // Schedule retry.
                    if (nextRetryCount <= MAX_RETRIES) {
                        console.log(
                            `Scheduling retry ${nextRetryCount}/${MAX_RETRIES}`
                        );

                        await publishConfirmed(
                            channel,
                            RETRY_EXCHANGE,
                            "notification.retry",
                            message.content,
                            options
                        );

                        console.log(
                            `Notification scheduled for retry ${nextRetryCount}`
                        );

                    } else {
                        // Maximum retry count exceeded.
                        console.error(
                            "Maximum retries exceeded. Moving event to DLQ."
                        );

                        await publishConfirmed(
                            channel,
                            DLX_EXCHANGE,
                            "notification.failed",
                            message.content,
                            options
                        );

                        console.log(
                            "Notification moved to Dead Letter Queue"
                        );
                    }

                    // Acknowledge original after confirmed publishing.
                    channel.ack(message);

                } catch (publishError) {
                    console.error(
                        "Failed to publish retry/DLQ message:",
                        publishError.message
                    );

                    // Requeue original if publishing failed.
                    channel.nack(message, false, true);
                }
            }
        },
        {
            noAck: false,
        }
    );
};

// ========================================
// ORDER CONFIRMATION EMAIL
// ========================================

async function sendOrderConfirmationEmail(data) {
    const {
        orderId,
        customerName,
        customerEmail,
        quantity,
        totalPrice,
    } = data;

    const subject =
        `ShopSphere: Order #${orderId} confirmed`;

    const text = `
Hello ${customerName || "Customer"},

Thank you for shopping with ShopSphere!

Your order #${orderId} has been placed successfully.

Quantity: ${quantity ?? "See your order details"}
Total: ${totalPrice ?? "See your order details"}

We will notify you when your order status changes.

Thank you,
ShopSphere Team
    `.trim();

    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Thank you for shopping with ShopSphere!</h2>
            <p>Hello ${escapeHtml(customerName || "Customer")},</p>
            <p>Your order <strong>#${escapeHtml(String(orderId))}</strong> has been placed successfully.</p>
            <p><strong>Quantity:</strong> ${escapeHtml(String(quantity ?? "See your order details"))}</p>
            <p><strong>Total:</strong> ${escapeHtml(String(totalPrice ?? "See your order details"))}</p>
            <p>We will notify you when your order status changes.</p>
            <p>Thank you,<br/>ShopSphere Team</p>
        </div>
    `;

    const emailResult = await sendEmail({
        to: customerEmail,
        subject,
        text,
        html,
    });

    console.log(
        `Order confirmation email sent for order ${orderId}`
    );

    return emailResult;
}

// ========================================
// ORDER STATUS UPDATE EMAIL
// ========================================

async function sendOrderStatusEmail(data) {
    const {
        orderId,
        customerName,
        customerEmail,
        status,
    } = data;

    if (!status) {
        throw new Error("Order status is missing from event");
    }

    const subject =
        `ShopSphere: Order #${orderId} status updated`;

    const text = `
Hello ${customerName || "Customer"},

The status of your ShopSphere order #${orderId} has been updated.

New status: ${status}

Thank you,
ShopSphere Team
    `.trim();

    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Your order status has been updated</h2>
            <p>Hello ${escapeHtml(customerName || "Customer")},</p>
            <p>The status of your order <strong>#${escapeHtml(String(orderId))}</strong> has changed.</p>
            <p><strong>New status:</strong> ${escapeHtml(status)}</p>
            <p>Thank you,<br/>ShopSphere Team</p>
        </div>
    `;

    const emailResult = await sendEmail({
        to: customerEmail,
        subject,
        text,
        html,
    });

    console.log(
        `Status update email sent for order ${orderId}: ${status}`
    );

    return emailResult;
}

// ========================================
// HTML ESCAPING
// ========================================

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
