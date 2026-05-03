import express from "express";

import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController.js";
import { authMiddleware, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, adminOnly, getStudents);
router.post("/", authMiddleware, adminOnly, createStudent);
router.put("/:id", authMiddleware, adminOnly, updateStudent);
router.delete("/:id", authMiddleware, adminOnly, deleteStudent);

export default router;
