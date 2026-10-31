import pool from "../config/database.js";


export const createOrder = async ({ userId, items, totalPrice, shippingAddress }) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Create one parent order.
        const orderResult = await client.query(
            `INSERT INTO orders (
        user_id,
        total_price,
        shipping_full_name,
        shipping_email,
        shipping_phone,
        shipping_address,
        shipping_city,
        shipping_postal_code
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING
        id,
        user_id,
        total_price,
        status,
        shipping_full_name,
        shipping_email,
        shipping_phone,
        shipping_address,
        shipping_city,
        shipping_postal_code,
        created_at,
        updated_at`,
            [
                userId,
                totalPrice,
                shippingAddress.fullName,
                shippingAddress.email,
                shippingAddress.phone,
                shippingAddress.address,
                shippingAddress.city,
                shippingAddress.postalCode
            ]
        );

        const order = orderResult.rows[0];
        const orderItems = [];

        // Save each product under the same order ID.
        for (const item of items) {
            const itemResult = await client.query(
                `INSERT INTO order_items
                    (order_id, product_id, quantity, unit_price, subtotal)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING
                    id,
                    order_id,
                    product_id,
                    quantity,
                    unit_price,
                    subtotal`,
                [
                    order.id,
                    item.productId,
                    item.quantity,
                    item.unitPrice,
                    item.subtotal
                ]
            );

            orderItems.push(itemResult.rows[0]);
        }

        await client.query("COMMIT");

        return {
            ...order,
            items: orderItems
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const findAllOrdersForAdmin = async () => {
    const result = await pool.query(
        `SELECT
            o.id,
            o.user_id,
            o.total_price,
            o.status,
            o.shipping_full_name,
            o.shipping_email,
            o.shipping_phone,
            o.shipping_address,
            o.shipping_city,
            o.shipping_postal_code,
            o.created_at,
            o.updated_at,
            COALESCE(
                (
                    SELECT json_agg(
                        json_build_object(
                            'id', oi.id,
                            'product_id', oi.product_id,
                            'quantity', oi.quantity,
                            'unit_price', oi.unit_price,
                            'subtotal', oi.subtotal
                        )
                        ORDER BY oi.id
                    )
                    FROM order_items oi
                    WHERE oi.order_id = o.id
                ),
                CASE
                    WHEN o.product_id IS NOT NULL THEN
                        json_build_array(
                            json_build_object(
                                'product_id', o.product_id,
                                'quantity', o.quantity,
                                'unit_price', o.unit_price,
                                'subtotal', o.total_price
                            )
                        )
                    ELSE '[]'::json
                END
            ) AS items
        FROM orders o
        ORDER BY o.created_at DESC`
    );

    return result.rows;
};

export const findOrdersByUserId = async (userId) => {
    const result = await pool.query(
        `SELECT
            o.id,
            o.user_id,
            o.total_price,
            o.status,
            o.created_at,
            o.updated_at,
            o.shipping_full_name,
            o.shipping_email,
            o.shipping_phone,
            o.shipping_address,
            o.shipping_city,
            o.shipping_postal_code,
            COALESCE(
                (
                    SELECT json_agg(
                        json_build_object(
                            'id', oi.id,
                            'product_id', oi.product_id,
                            'quantity', oi.quantity,
                            'unit_price', oi.unit_price,
                            'subtotal', oi.subtotal
                        )
                        ORDER BY oi.id
                    )
                    FROM order_items oi
                    WHERE oi.order_id = o.id
                ),
                CASE
                    WHEN o.product_id IS NOT NULL THEN
                        json_build_array(
                            json_build_object(
                                'product_id', o.product_id,
                                'quantity', o.quantity,
                                'unit_price', o.unit_price,
                                'subtotal', o.total_price
                            )
                        )
                    ELSE '[]'::json
                END
            ) AS items
        FROM orders o
        WHERE o.user_id = $1
        ORDER BY o.created_at DESC`,
        [userId]
    );

    return result.rows;
};

export const findOrderById = async (orderId, userId) => {
    const result = await pool.query(
        `SELECT
            o.id,
            o.user_id,
            o.total_price,
            o.status,

            -- Shipping details
            o.shipping_full_name AS shipping_name,
            o.shipping_email,
            o.shipping_phone,
            o.shipping_address,
            o.shipping_city,
            o.shipping_postal_code,

            o.created_at,
            o.updated_at,

            -- Order items
            COALESCE(
                (
                    SELECT json_agg(
                        json_build_object(
                            'id', oi.id,
                            'product_id', oi.product_id,
                            'quantity', oi.quantity,
                            'unit_price', oi.unit_price,
                            'subtotal', oi.subtotal
                        )
                        ORDER BY oi.id
                    )
                    FROM order_items oi
                    WHERE oi.order_id = o.id
                ),
                CASE
                    WHEN o.product_id IS NOT NULL THEN
                        json_build_array(
                            json_build_object(
                                'product_id', o.product_id,
                                'quantity', o.quantity,
                                'unit_price', o.unit_price,
                                'subtotal', o.total_price
                            )
                        )
                    ELSE '[]'::json
                END
            ) AS items

        FROM orders o
        WHERE o.id = $1
          AND o.user_id = $2`,
        [orderId, userId]
    );

    return result.rows[0] ?? null;
};

export const cancelOrderById = async (orderId, userId) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Change status only if the order is still pending.
        const result = await client.query(
            `UPDATE orders
             SET
                 status = 'CANCELLED',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
               AND user_id = $2
               AND status = 'PENDING'
             RETURNING
                 id,
                 user_id,
                 total_price,
                 status,
                 updated_at`,
            [orderId, userId]
        );

        const cancelledOrder = result.rows[0];

        if (!cancelledOrder) {
            await client.query("ROLLBACK");
            return null;
        }

        // Retrieve all items belonging to this order.

        const itemsResult = await client.query(
            `SELECT
         product_id,
         quantity,
         unit_price,
         subtotal
     FROM order_items
     WHERE order_id = $1
     ORDER BY id`,
            [orderId]
        );

        let items = itemsResult.rows;

        // Legacy orders may store their single product directly in orders.
        if (items.length === 0) {
            const legacyResult = await client.query(
                `SELECT product_id, quantity, unit_price, total_price
         FROM orders
         WHERE id = $1`,
                [orderId]
            );

            const legacyOrder = legacyResult.rows[0];

            if (legacyOrder?.product_id != null && legacyOrder?.quantity != null) {
                items = [{
                    product_id: legacyOrder.product_id,
                    quantity: legacyOrder.quantity,
                    unit_price: legacyOrder.unit_price,
                    subtotal: legacyOrder.total_price
                }];
            }
        }

        cancelledOrder.items = items;

        await client.query("COMMIT");

        return cancelledOrder;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const findOrderByIdForAdmin = async (orderId) => {
    const result = await pool.query(
        `SELECT
            id,
            user_id,
            total_price,
            status,
            shipping_full_name,
            shipping_email,
            created_at,
            updated_at
         FROM orders
         WHERE id = $1`,
        [orderId]
    );

    return result.rows[0] ?? null;
};

export const updateOrderStatusById = async (orderId, newStatus) => {
    const result = await pool.query(
        `UPDATE orders
         SET status = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
           AND status = $3
         RETURNING
             id,
             user_id,
             total_price,
             status,
             shipping_full_name,
             shipping_email,
             created_at,
             updated_at`,
        [orderId, newStatus, getPreviousStatus(newStatus)]
    );

    return result.rows[0] ?? null;
};

function getPreviousStatus(newStatus) {
    const previousStatuses = {
        CONFIRMED: "PENDING",
        SHIPPED: "CONFIRMED",
        DELIVERED: "SHIPPED",
    };

    return previousStatuses[newStatus];
}