import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import pool from "./config/database.js"
import userRoutes from "./routes/user.routes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3001;

//Middlewares
app.use(express.json());
app.use(cors());

//health check
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        service: "user-service",
        message: "User service is running"
    });
});

//Database health check
app.get("/health/db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.status(200).json({
            status: true,
            database: "connected",
            time: result.rows[0].now
        });
    } catch (error) {
        console.error("Database connected error:", error);

        res.status(500).json({
            success: false,
            database: "connection failed"
        });
    }
});

//User routes
app.use("/api/users", userRoutes)

//Start server
app.listen(PORT, () => {
    console.log(`User service is running on port ${PORT}`);
});