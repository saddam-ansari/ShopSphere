import {
    placeOrder,
    getUserOrders,
    getUserOrderById,
    cancelUserOrder,
    updateOrderStatus,
} from "../services/order.service.js";
import { findAllOrdersForAdmin } from "../repositories/order.repository.js";

export const create = async (req, res) => {
    try {
        const { items, shippingAddress } = req.body;

        const order = await placeOrder({
            userId: req.user.userId,
            items,
            shippingAddress,
        });

        return res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: order
        });
    } catch (error) {
        console.error("Create order error:", error);

        const badRequestErrors = [
            "At least one order item is required",
            "Invalid product ID or quantity",
            "Product ID and quantity are required",
            "Quantity must be greater than zero",
            "Product not found",
            "Insufficient stock",
            "Invalid product price",
            "All shipping details are required",
            "Invalid shipping email",
            "Phone number must contain 10 digits",
            "PIN code must contain 6 digits"
        ];

        if (badRequestErrors.includes(error.message)) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === "Product service unavailable") {
            return res.status(503).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


export const getAll = async (req, res) => {
    try {
        const orders = await getUserOrders(req.user.userId);

        return res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getById = async (req, res) => {
    try {

        const order = await getUserOrderById(req.params.id, req.user.userId);

        return res.status(200).json({
            success: true,
            data: order
        });

    } catch (error) {

        if (error.message === "Order not found") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const cancel = async (req, res) => {
    try {

        const order = await cancelUserOrder(req.params.id, req.user.userId);

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            data: order
        });

    } catch (error) {

        if (error.message === "Order not found") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === "Only pending orders can be cancelled") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const updateStatus = async (req, res) => {
    try {
        const orderId = Number(req.params.id);
        const { status } = req.body;

        if (!Number.isSafeInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID",
            });
        }

        const order = await updateOrderStatus(orderId, status);

        return res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            data: order,
        });
    } catch (error) {
        if (error.message === "Order not found") {
            return res.status(404).json({
                success: false,
                message: error.message,
            });
        }

        if (
            error.message === "Invalid order status" ||
            error.message.startsWith("Cannot change order status") ||
            error.message.startsWith("Order status changed concurrently")
        ) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        console.error("Update order status error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


export const getAllOrdersForAdmin = async (req, res) => {
    try {
        const orders = await findAllOrdersForAdmin();

        return res.status(200).json({
            success: true,
            message: "Orders fetched successfully",
            data: orders,
        });
    } catch (error) {
        console.error("Failed to fetch all admin orders:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch orders",
        });
    }
};
