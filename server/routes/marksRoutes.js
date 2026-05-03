const express = require("express");
const { createMarks, getMarksByStudent } = require("../controllers/marksController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/", authMiddleware, createMarks);
router.get("/:studentId", authMiddleware, getMarksByStudent);

module.exports = router;
