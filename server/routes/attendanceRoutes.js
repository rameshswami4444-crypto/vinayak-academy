import express from "express";

import {
  getAttendance,
  createAttendance,
  getAttendanceByStudent,
} from "../controllers/attendanceController.js";
import { authMiddleware, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, adminOnly, getAttendance);
router.post("/", authMiddleware, adminOnly, createAttendance);
router.get("/:studentId", authMiddleware, getAttendanceByStudent);

export default router;
