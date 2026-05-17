import express from "express";

import { getCourses, createCourse } from "../controllers/courseController.js";
import { authMiddleware, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getCourses);
router.post("/", authMiddleware, adminOnly, createCourse);

export default router;
