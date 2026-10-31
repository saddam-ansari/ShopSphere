import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { SERVICES } from "../config/services.js";

const router = express.Router();

// User Service
router.use("/users", createProxyMiddleware({
    target: SERVICES.USER_SERVICE,
    changeOrigin: true,
    pathRewrite: (path) => `/api/users${path}`
})
);

// Product Service
router.use("/products", createProxyMiddleware({
    target: SERVICES.PRODUCT_SERVICE,
    changeOrigin: true,
    pathRewrite: (path) => `/api/products${path}`
})
);

// Order Service
router.use("/orders", createProxyMiddleware({
    target: SERVICES.ORDER_SERVICE,
    changeOrigin: true,
    pathRewrite: (path) => `/api/orders${path}`
})
);

export default router;