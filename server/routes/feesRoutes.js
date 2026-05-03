import express from "express";

import { getFees, createFees, getFeesByStudent } from "../controllers/feesController.js";
import { authMiddleware, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, adminOnly, getFees);
router.post("/", authMiddleware, adminOnly, createFees);
router.get("/:studentId", authMiddleware, getFeesByStudent);

export default router;
