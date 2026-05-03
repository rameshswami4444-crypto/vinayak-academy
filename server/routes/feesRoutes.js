const express = require("express");
const { createFees, getFeesByStudent } = require("../controllers/feesController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/", authMiddleware, createFees);
router.get("/:studentId", authMiddleware, getFeesByStudent);

module.exports = router;
