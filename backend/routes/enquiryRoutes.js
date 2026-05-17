import express from "express";

import { createEnquiry, getEnquiries } from "../controllers/enquiryController.js";
import { authMiddleware, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.post("/", createEnquiry);
router.get("/", authMiddleware, adminOnly, getEnquiries);

export default router;
