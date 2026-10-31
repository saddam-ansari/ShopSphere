import express from "express";

import {
    create,
    getAll,
    getById,
    update,
    remove,
    reserveStock,
    restoreStock 
} from "../controllers/product.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import allowRoles from "../middleware/role.middleware.js";
import { serviceAuth } from "../middleware/serviceAuth.middleware.js";

const router = express.Router();

//Public
router.get("/", getAll);
router.post("/:id/reserve-stock", serviceAuth, reserveStock);
router.post("/:id/restore-stock", serviceAuth, restoreStock);
router.get("/:id", getById);

//ADMIN only
router.post("/", authMiddleware, allowRoles("ADMIN"), create);
router.put("/:id", authMiddleware, allowRoles("ADMIN"), update);
router.delete("/:id", authMiddleware, allowRoles("ADMIN"), remove);

export default router;
