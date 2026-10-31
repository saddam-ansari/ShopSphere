import "dotenv/config";

export const SERVICES = {
    USER_SERVICE: process.env.USER_SERVICE_URL,
    PRODUCT_SERVICE: process.env.PRODUCT_SERVICE_URL,
    ORDER_SERVICE: process.env.ORDER_SERVICE_URL
};