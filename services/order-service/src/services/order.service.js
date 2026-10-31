import {
    createOrder,
    findOrdersByUserId,
    findOrderById,
    cancelOrderById,
    findOrderByIdForAdmin,
    updateOrderStatusById,
} from "../repositories/order.repository.js";
import {
    getProductFromProductService,
    reserveStockInProductService,
    restoreStockInProductService
} from "./product.client.js";
import {
    publishOrderCreated,
    publishOrderStatusUpdated,
} from "../events/order.publisher.js";


export const placeOrder = async ({ userId, items, shippingAddress }) => {
    const requiredShippingFields = [
        "fullName",
        "email",
        "phone",
        "address",
        "city",
        "postalCode"
    ];

    if (
        !shippingAddress ||
        typeof shippingAddress !== "object" ||
        requiredShippingFields.some(
            (field) =>
                typeof shippingAddress[field] !== "string" ||
                !shippingAddress[field].trim()
        )
    ) {
        throw new Error("All shipping details are required");
    }

    const normalizedShippingAddress = {
        fullName: shippingAddress.fullName.trim(),
        email: shippingAddress.email.trim(),
        phone: shippingAddress.phone.trim(),
        address: shippingAddress.address.trim(),
        city: shippingAddress.city.trim(),
        postalCode: shippingAddress.postalCode.trim()
    };

    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            normalizedShippingAddress.email
        )
    ) {
        throw new Error("Invalid shipping email");
    }

    if (!/^\d{10}$/.test(normalizedShippingAddress.phone)) {
        throw new Error("Phone number must contain 10 digits");
    }

    if (!/^\d{6}$/.test(normalizedShippingAddress.postalCode)) {
        throw new Error("PIN code must contain 6 digits");
    }

    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("At least one order item is required");
    }

    const validatedItems = [];
    const reservedItems = [];
    let totalPrice = 0;

    // Phase 1: Validate all products before reserving stock.
    for (const item of items) {
        const productId = Number(item.productId);
        const quantity = Number(item.quantity);

        if (
            !Number.isSafeInteger(productId) ||
            productId <= 0 ||
            !Number.isSafeInteger(quantity) ||
            quantity <= 0
        ) {
            throw new Error("Invalid product ID or quantity");
        }

        const product = await getProductFromProductService(productId);

        if (!product) {
            throw new Error("Product not found");
        }

        const unitPrice = Number(product.price);
        const stock = Number(product.stock);

        if (!Number.isFinite(stock) || stock < quantity) {
            throw new Error("Insufficient stock");
        }

        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            throw new Error("Invalid product price");
        }

        const subtotal =
            Math.round(unitPrice * quantity * 100) / 100;

        validatedItems.push({
            productId,
            quantity,
            unitPrice,
            subtotal
        });

        totalPrice += subtotal;
    }

    totalPrice = Math.round(totalPrice * 100) / 100;

    // Phase 2: Reserve stock atomically in the Product Service.
    try {
        for (const item of validatedItems) {
            await reserveStockInProductService(
                item.productId,
                item.quantity
            );

            // Track only confirmed successful reservations.
            reservedItems.push(item);
        }
    } catch (error) {
        await restoreReservedItems(reservedItems);
        throw error;
    }

    // Phase 3: Save the order. If saving fails, compensate once.
    let order;

    try {
        order = await createOrder({
            userId,
            items: validatedItems,
            totalPrice,
            shippingAddress: normalizedShippingAddress
        });
    } catch (error) {
        await restoreReservedItems(reservedItems);
        throw error;
    }

    // Phase 4: Publishing failure must not restore stock.
    try {
        await publishOrderCreated(order);
    } catch (error) {
        console.error(
            "Order was saved, but event publishing failed:",
            error.message
        );

        // A durable retry mechanism or transactional outbox is needed
        // to guarantee eventual event delivery.
    }

    return order;
};

async function restoreReservedItems(reservedItems) {
    const failures = [];

    for (const item of [...reservedItems].reverse()) {
        try {
            await restoreStockInProductService(
                item.productId,
                item.quantity
            );
        } catch (error) {
            failures.push({
                productId: item.productId,
                quantity: item.quantity,
                message: error.message
            });
        }
    }

    if (failures.length > 0) {
        console.error(
            "CRITICAL: Manual or automated stock reconciliation required:",
            failures
        );

        throw new Error(
            "Stock restoration was incomplete; reconciliation is required"
        );
    }
}


export const getUserOrders = async (userId) => {
    return await findOrdersByUserId(userId);
};

export const getUserOrderById = async (orderId, userId) => {
    const order = await findOrderById(orderId, userId);

    if (!order) {
        throw new Error("Order not found");
    }

    return order;
};


export const cancelUserOrder = async (orderId, userId) => {
    const order = await findOrderById(orderId, userId);

    if (!order) {
        throw new Error("Order not found");
    }

    if (order.status !== "PENDING") {
        throw new Error("Only pending orders can be cancelled");
    }

    const cancelledOrder = await cancelOrderById(orderId, userId);

    if (!cancelledOrder) {
        throw new Error(
            "Order could not be cancelled; it may already be cancelled"
        );
    }

    const restorationFailures = [];

    for (const item of cancelledOrder.items) {
        try {
            await restoreStockInProductService(
                Number(item.product_id),
                Number(item.quantity)
            );
        } catch (error) {
            restorationFailures.push({
                productId: item.product_id,
                quantity: item.quantity,
                message: error.message
            });
        }
    }

    if (restorationFailures.length > 0) {
        console.error(
            `Stock restoration failed for cancelled order ${orderId}:`,
            restorationFailures
        );

        throw new Error(
            "Order was cancelled, but stock restoration requires reconciliation"
        );
    }

    return cancelledOrder;
};


export const updateOrderStatus = async (orderId, newStatus) => {
    const allowedTransitions = {
        PENDING: ["CONFIRMED"],
        CONFIRMED: ["SHIPPED"],
        SHIPPED: ["DELIVERED"],
        DELIVERED: [],
        CANCELLED: [],
    };

    const validStatuses = ["CONFIRMED", "SHIPPED", "DELIVERED"];

    if (!validStatuses.includes(newStatus)) {
        throw new Error("Invalid order status");
    }

    const order = await findOrderByIdForAdmin(orderId);

    if (!order) {
        throw new Error("Order not found");
    }

    const allowedNextStatuses = allowedTransitions[order.status];

    if (!allowedNextStatuses?.includes(newStatus)) {
        throw new Error(
            `Cannot change order status from ${order.status} to ${newStatus}`
        );
    }

    const updatedOrder = await updateOrderStatusById(
        orderId,
        newStatus
    );

    if (!updatedOrder) {
        throw new Error(
            "Order status changed concurrently. Please refresh and try again."
        );
    }

    // Publish the event after the status update succeeds.
    try {
        await publishOrderStatusUpdated(updatedOrder);
    } catch (error) {
        console.error(
            `Failed to publish status event for order ${orderId}:`,
            error.message
        );
    }

    return updatedOrder;
};
