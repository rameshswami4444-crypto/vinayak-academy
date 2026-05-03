import express from "express";

import { getMarks, createMarks, getMarksByStudent } from "../controllers/marksController.js";
import { authMiddleware, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, adminOnly, getMarks);
router.post("/", authMiddleware, adminOnly, createMarks);
router.get("/:studentId", authMiddleware, getMarksByStudent);

export default router;
