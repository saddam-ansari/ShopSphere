import express from "express";
import dotenv from "dotenv";

import { connectRabbitMQ } from "./config/rabbitmq.js";
import { verifyNotificationDBConnection } from "./config/database.js";
import { startOrderConsumer } from "./events/order.consumer.js";
import { verifyEmailConnection } from "./utils/email.service.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        success: true,
        service: "notification-service",
        status: "UP"
    });
});

const startServer = async () => {
    try {
        // 1. Verify PostgreSQL connection
        await verifyNotificationDBConnection();

        // 2. Connect to RabbitMQ
        await connectRabbitMQ();

        // 3. Verify SMTP email connection
        await verifyEmailConnection();

        // 4. Start consuming order events
        await startOrderConsumer();

        // 5. Start Express server
        app.listen(PORT, () => {
            console.log(`Notification service is running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Failed to start Notification Service:", error);
        process.exit(1);
    }
};

startServer();