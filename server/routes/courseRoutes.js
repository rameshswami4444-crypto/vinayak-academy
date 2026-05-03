const express = require("express");
const { getCourses, createCourse } = require("../controllers/courseController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/", authMiddleware, getCourses);
router.post("/", authMiddleware, createCourse);

module.exports = router;
