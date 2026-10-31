
import { getNotificationDB } from "../config/database.js";

// Find an existing notification using its unique event ID.
export const findNotificationByEventId = async (eventId) => {
    const db = getNotificationDB();

    const result = await db.query(
        `SELECT *
         FROM notification_logs
         WHERE event_id = $1`,
        [eventId]
    );

    return result.rows[0] || null;
};

// Register a new notification event.
export const createNotificationLog = async ({
    eventId,
    orderId,
    eventType,
    customerEmail,
}) => {
    const db = getNotificationDB();

    const result = await db.query(
        `INSERT INTO notification_logs
            (
                event_id,
                order_id,
                event_type,
                customer_email,
                status,
                attempts,
                processing_started_at
            )
         VALUES ($1, $2, $3, $4, 'PROCESSING', 1, CURRENT_TIMESTAMP)
         ON CONFLICT (event_id) DO NOTHING
         RETURNING *`,
        [eventId, orderId, eventType, customerEmail]
    );

    return result.rows[0] || null;
};

// Update notification status and delivery information.
export const updateNotificationStatus = async (
    eventId,
    status,
    errorMessage = null,
    deliveryReference = null
) => {
    const db = getNotificationDB();

    const result = await db.query(
        `UPDATE notification_logs
         SET status = $2::VARCHAR(20),
             error_message = $3,
             delivery_reference = CASE
                 WHEN $2::TEXT = 'SENT'
                 THEN $4
                 ELSE NULL
             END,
             last_delivery_attempt_at = CASE
                 WHEN $2::TEXT = 'SENT'
                 THEN CURRENT_TIMESTAMP
                 ELSE last_delivery_attempt_at
             END,
             sent_at = CASE
                 WHEN $2::TEXT = 'SENT'
                 THEN CURRENT_TIMESTAMP
                 ELSE NULL::TIMESTAMP
             END,
             processing_started_at = CASE
                 WHEN $2::TEXT IN ('SENT', 'FAILED')
                 THEN NULL::TIMESTAMP
                 ELSE processing_started_at
             END
         WHERE event_id = $1
         RETURNING *`,
        [eventId, status, errorMessage, deliveryReference]
    );

    return result.rows[0] || null;
};

// Claim a failed notification for retry.
export const claimFailedNotification = async (eventId) => {
    const db = getNotificationDB();

    const result = await db.query(
        `UPDATE notification_logs
         SET status = 'PROCESSING',
             attempts = attempts + 1,
             error_message = NULL,
             processing_started_at = CURRENT_TIMESTAMP
         WHERE event_id = $1
           AND status = 'FAILED'
         RETURNING *`,
        [eventId]
    );

    return result.rows[0] || null;
};

// Recover a notification stuck in PROCESSING for over five minutes.
export const claimStaleNotification = async (eventId) => {
    const db = getNotificationDB();

    const result = await db.query(
        `UPDATE notification_logs
         SET status = 'PROCESSING',
             attempts = attempts + 1,
             error_message = NULL,
             processing_started_at = CURRENT_TIMESTAMP
         WHERE event_id = $1
           AND status = 'PROCESSING'
           AND processing_started_at <
               CURRENT_TIMESTAMP - INTERVAL '5 minutes'
         RETURNING *`,
        [eventId]
    );

    return result.rows[0] || null;
};
