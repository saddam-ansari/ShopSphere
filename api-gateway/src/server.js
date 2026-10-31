import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import gatewayRoutes from "./routes/gateway.routes.js";

dotenv.config();
const app = express();
app.use(cors());

const PORT = process.env.PORT || 4000;

app.get("/health", (req, res) => {
    res.json({
        success: true,
        service: "api-gateway",
        status: "UP"
    });
});

app.use("/api", gatewayRoutes);

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});