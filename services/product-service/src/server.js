import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import pool from "./config/database.js";
import productRoutes from "./routes/product.routes.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { startOrderConsumer } from "./events/order.consumer.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3002;

//Middlewares
app.use(express.json());
app.use(cors());

//Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        service: "product-service",
        message: "Product service is running"
    });
});

//Database heslth check
app.get("/health/db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.status(200).json({
            success: true,
            database: "connected",
            time: result.rows[0].now
        })
    }
    catch (error) {
        console.error("Database connection error:", error);
        res.status(500).json({
            success: false,
            message: "connection failed"
        })
    }
});

const startServer = async () => {
    try {
        await connectRabbitMQ();
        await startOrderConsumer();
    } catch (error) {
        console.error("Failed to start Product Service:", error.message);
        process.exit(1);
    }
};

startServer();

//Product routes
app.use("/api/products", productRoutes);

app.listen(PORT, () => {
    console.log(`Product service is running on port ${PORT}`);
})