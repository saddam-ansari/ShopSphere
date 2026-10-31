import {
    addProduct,
    listProducts,
    getProduct,
    editProduct,
    removeProduct,
    reserveProductStock,
    restoreProductStock
} from "../services/product.service.js";

export const create = async (req, res) => {
    try {
        const product = await addProduct(req.body);

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product
        })
    }
    catch (error) {
        console.error(error);
        if (
            error.message === "Name and price are required" ||
            error.message === "Price cannot be negative" ||
            error.message === "Stock cannot be negative"
        ) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
};

export const getAll = async (req, res) => {
    try {
        const products = await listProducts();

        return res.status(200).json({
            success: true,
            count: products.length,
            data: products
        })
    }
    catch (error) {
        console.error(error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getById = async (req, res) => {
    try {
        const product = await getProduct(req.params.id);

        return res.status(200).json({
            success: true,
            data: product
        })
    }
    catch (error) {
        console.error(error.message);

        if (error.message === "Product not found") {
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

export const update = async (req, res) => {
    try {
        const product = await editProduct(req.params.id, req.body);

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: product
        });
    }
    catch (error) {
        if (error.message === "Product not found") {
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

export const remove = async (req, res) => {
    try {
        await removeProduct(req.params.id);

        return res.status(200).json({
            message: true,
            message: "Product deleted succesfully"
        });
    }
    catch (error) {
        if (error.message === "Product not found") {
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

export const reserveStock = async (req, res) => {
    try {
        const productId = Number(req.params.id);
        const { quantity } = req.body;

        if (!Number.isSafeInteger(productId) || productId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await reserveProductStock(
            productId,
            quantity
        );

        return res.status(200).json({
            success: true,
            message: "Stock reserved successfully",
            data: product
        });
    } catch (error) {
        const statusCode =
            error.message === "Product not found" ? 404 :
                error.message === "Insufficient stock" ? 409 :
                    error.message === "Quantity must be a positive integer" ? 400 :
                        500;

        return res.status(statusCode).json({
            success: false,
            message: error.message || "Failed to reserve stock"
        });
    }
};


export const restoreStock = async (req, res) => {
    try {
        const productId = Number(req.params.id);
        const quantity = req.body.quantity;

        if (!Number.isSafeInteger(productId) || productId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        const product = await restoreProductStock(productId, quantity);

        return res.status(200).json({
            success: true,
            message: "Stock restored successfully",
            data: product
        });
    } catch (error) {
        const statusCode =
            error.message === "Product not found" ? 404 :
                error.message === "Invalid product ID" ||
                    error.message === "Quantity must be a positive integer" ? 400 :
                    500;

        return res.status(statusCode).json({
            success: false,
            message: error.message || "Failed to restore stock"
        });
    }
};
