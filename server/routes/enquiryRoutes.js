const express = require("express");
const { createEnquiry, getEnquiries } = require("../controllers/enquiryController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/", createEnquiry);
router.get("/", authMiddleware, getEnquiries);

module.exports = router;
