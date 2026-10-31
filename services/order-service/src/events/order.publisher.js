import { randomUUID } from "crypto";
import { getChannel } from "../config/rabbitmq.js";

const EXCHANGE_NAME = "shopsphere.events";

const publishEvent = async (routingKey, message) => {
    const channel = getChannel();

    await channel.assertExchange(EXCHANGE_NAME, "topic", {
        durable: true,
    });

    const messageBuffer = Buffer.from(JSON.stringify(message));

    await new Promise((resolve, reject) => {
        channel.publish(
            EXCHANGE_NAME,
            routingKey,
            messageBuffer,
            {
                persistent: true,
                messageId: message.eventId,
                contentType: "application/json",
            },
            (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            }
        );
    });

    console.log(
        `Published event: ${routingKey}, Event ID: ${message.eventId}`
    );
};

export const publishOrderCreated = async (order) => {
    console.log("Order received by event publisher:", order);
    const message = {
        eventId: randomUUID(),
        eventType: "order.created",
        data: {
            orderId: order.id,
            userId: order.user_id,
            customerName: order.shipping_full_name,
            customerEmail: order.shipping_email,
            productId: order.product_id,
            quantity: order.quantity,
            unitPrice: order.unit_price,
            totalPrice: order.total_price,
        },
    };

    await publishEvent("order.created", message);
};

export const publishOrderStatusUpdated = async (order) => {
    const message = {
        eventId: randomUUID(),
        eventType: "order.status.updated",
        data: {
            orderId: order.id,
            userId: order.user_id,
            customerName: order.shipping_full_name,
            customerEmail: order.shipping_email,
            status: order.status,
        },
    };

    await publishEvent("order.status.updated", message);
};