
import axios from "axios";

const productServiceUrl = process.env.PRODUCT_SERVICE_URL;
const serviceSecret = process.env.SERVICE_SECRET;

const productService = axios.create({
    baseURL: productServiceUrl,
    timeout: 5000,
    headers: {
        "x-service-secret": serviceSecret
    }
});

export const getProductFromProductService = async (productId) => {
    try {
        const response = await productService.get(
            `/api/products/${productId}`
        );

        return response.data.data;
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error("Product not found");
        }

        throw new Error("Product service unavailable");
    }
};

export const reserveStockInProductService = async (
    productId,
    quantity
) => {
    try {
        const response = await productService.post(
            `/api/products/${productId}/reserve-stock`,
            { quantity }
        );

        return response.data.data;
    } catch (error) {
        if (error.response?.status === 409) {
            throw new Error("Insufficient stock");
        }

        if (error.response?.status === 404) {
            throw new Error("Product not found");
        }

        if (error.response?.status === 400) {
            throw new Error("Invalid product ID or quantity");
        }

        throw new Error("Product service unavailable");
    }
};

export const restoreStockInProductService = async (
    productId,
    quantity
) => {
    try {
        const response = await productService.post(
            `/api/products/${productId}/restore-stock`,
            { quantity }
        );

        return response.data.data;
    } catch {
        throw new Error("Failed to restore product stock");
    }
};
