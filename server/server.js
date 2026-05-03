import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import { ensureDefaultAdmin } from "./controllers/authController.js";
import { getStudentDashboard } from "./controllers/studentController.js";
import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import marksRoutes from "./routes/marksRoutes.js";
import feesRoutes from "./routes/feesRoutes.js";
import { authMiddleware } from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Vinayak Academy backend is running.",
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    uptime: process.uptime(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.get("/api/student/dashboard", authMiddleware, getStudentDashboard);
app.use("/api/courses", courseRoutes);
app.use("/api/enquiry", enquiryRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/fees", feesRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, _req, res, _next) => {
  console.error("Unhandled server error:", error);
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal server error.",
  });
});

async function startServer() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in environment variables.");
  }

  await connectDB();
  await ensureDefaultAdmin();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});

export default app;
