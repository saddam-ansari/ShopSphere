import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import pool from "./config/database.js";
import orderRoutes from "./routes/order.routes.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3003;

app.use(express.json());
app.use(cors());

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        service: "order-service",
        message: "Order service is running"
    });
});

app.get("/health/db", async (req, res) => {

    try {
        const result = await pool.query("SELECT NOW()");

        res.status(200).json({
            success: true,
            database: "connected",
            time: result.rows[0].now
        });

    } catch (error) {

        console.error("Database connection error:", error);

        res.status(500).json({
            success: false,
            database: "connection failed"
        });
    }
});

const startServer = async () => {
    try {
        await connectRabbitMQ();
    } catch (error) {
        console.error("Failed to start Order Service:", error.message);
        process.exit(1);
    }
};

startServer();

app.use("/api/orders", orderRoutes);

app.listen(PORT, () => {
    console.log(`Order service is running on port ${PORT}`);
});