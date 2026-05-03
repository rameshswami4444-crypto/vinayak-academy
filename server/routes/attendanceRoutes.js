const express = require("express");
const {
  createAttendance,
  getAttendanceByStudent,
} = require("../controllers/attendanceController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/", authMiddleware, createAttendance);
router.get("/:studentId", authMiddleware, getAttendanceByStudent);

module.exports = router;
