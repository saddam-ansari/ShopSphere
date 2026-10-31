import express from "express";

import {
    create,
    getAll,
    getById,
    cancel,
    updateStatus,
    getAllOrdersForAdmin,
} from "../controllers/order.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import adminMiddleware from "../middleware/admin.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, create);

router.get("/", authMiddleware, getAll);

router.get("/:id", authMiddleware, getById);

router.patch("/:id/cancel", authMiddleware, cancel);

router.patch("/:id/status", authMiddleware, adminMiddleware, updateStatus);

router.get("/admin/all", authMiddleware, adminMiddleware, getAllOrdersForAdmin);

export default router;