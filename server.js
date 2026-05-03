const path = require("path");
const bcrypt = require("bcryptjs");
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Enquiry = require("./models/Enquiry");
const User = require("./models/User");
const Course = require("./models/Course");
const Student = require("./models/Student");
const Attendance = require("./models/Attendance");
const Marks = require("./models/Marks");
const Fees = require("./models/Fees");


dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI;
const jwtSecret = process.env.JWT_SECRET;
const adminAccessCode = process.env.ADMIN_ACCESS_CODE;
const demoStudentName = process.env.DEMO_STUDENT_NAME || "Ankit Sharma";
const demoStudentEmail = (process.env.DEMO_STUDENT_EMAIL || "student@vinayakacademy.in").toLowerCase();
const demoStudentMobile = process.env.DEMO_STUDENT_MOBILE || "9876543210";
const demoStudentPassword = process.env.DEMO_STUDENT_PASSWORD || "student123";
const demoAdminName = process.env.DEMO_ADMIN_NAME || "Admin User";
const demoAdminEmail = (process.env.DEMO_ADMIN_EMAIL || "admin@vinayakacademy.in").toLowerCase();
const demoAdminMobile = process.env.DEMO_ADMIN_MOBILE || "9998887776";
const demoAdminPassword = process.env.DEMO_ADMIN_PASSWORD || "admin12345";

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname)));

function createToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    jwtSecret,
    {
      expiresIn: "7d",
    }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authorization token is required.",
    });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required.",
    });
  }

  return next();
}

async function findStudentByAuthUser(user) {
  if (!user?.email) {
    return null;
  }

  return Student.findOne({ email: String(user.email).toLowerCase() }).populate("course");
}

async function registerUser(req, res) {
  try {
    const { fullName, email, mobile, password } = req.body;

    if (!fullName || !email || !mobile || !password) {
      return res.status(400).json({
        message: "Full name, email, mobile, and password are required.",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { mobile }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists with this email or mobile number.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      mobile,
      passwordHash,
      role: "student",
    });

    const token = createToken(user);

    return res.status(201).json({
      message: "Account created successfully.",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to create account right now.",
    });
  }
}

app.post("/api/auth/signup", registerUser);
app.post("/api/auth/register", registerUser);

app.post("/api/auth/login", async (req, res) => {
  try {
    const { identifier, password, role, accessCode } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const normalizedIdentifier = String(identifier).trim().toLowerCase();
    const requestedRole = role === "admin" ? "admin" : "student";

    const user = await User.findOne({
      role: requestedRole,
      $or: [{ email: normalizedIdentifier }, { mobile: String(identifier).trim() }],
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid login credentials.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid login credentials.",
      });
    }

    if (requestedRole === "admin" && adminAccessCode && accessCode !== adminAccessCode) {
      return res.status(401).json({
        message: "Invalid admin access code.",
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to login right now.",
    });
  }
});

async function createEnquiry(req, res) {
  try {
    const { name, email, phone, course } = req.body;

    if (!name || !email || !phone || !course) {
      return res.status(400).json({
        message: "Name, email, phone, and course are required.",
      });
    }

    const enquiry = await Enquiry.create({
      name,
      email,
      phone,
      course,
    });

    return res.status(201).json({
      message: "Enquiry submitted successfully.",
      enquiryId: enquiry._id,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to submit enquiry right now.",
    });
  }
}

app.post("/api/enquiries", createEnquiry);
app.post("/api/enquiry", createEnquiry);

app.get("/api/enquiry", authMiddleware, adminOnly, async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    return res.status(200).json(enquiries);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch enquiries right now.",
    });
  }
});

app.get("/api/students", authMiddleware, adminOnly, async (req, res) => {
  try {
    const students = await Student.find()
      .populate("course")
      .populate("attendance")
      .populate("marks")
      .sort({ createdAt: -1 });

    return res.status(200).json(students);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch students right now.",
    });
  }
});

app.post("/api/students", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, phone, password, course, fees } = req.body;

    if (!name || !email || !phone || !password || !course || fees === undefined) {
      return res.status(400).json({
        message: "All student fields are required.",
      });
    }

    const existingCourse = await Course.findById(course);
    if (!existingCourse) {
      return res.status(404).json({
        message: "Course not found.",
      });
    }

    const existingStudent = await Student.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });

    if (existingStudent) {
      return res.status(409).json({
        message: "Student already exists.",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { mobile: phone }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "A login account already exists with this email or mobile number.",
      });
    }

    const student = await Student.create({
      name,
      email,
      phone,
      password,
      course,
      fees,
    });

    const passwordHash = await bcrypt.hash(password, 10);

    await User.create({
      fullName: name,
      email,
      mobile: phone,
      passwordHash,
      role: "student",
    });

    const populatedStudent = await Student.findById(student._id).populate("course");
    return res.status(201).json(populatedStudent);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to create student right now.",
    });
  }
});

app.put("/api/students/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    const previousEmail = student.email;
    const previousPhone = student.phone;
    const allowedFields = ["name", "email", "phone", "password", "course", "fees"];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        student[field] = req.body[field];
      }
    }

    await student.save();

    const linkedUser = await User.findOne({
      $or: [{ email: previousEmail }, { mobile: previousPhone }],
      role: "student",
    });

    if (linkedUser) {
      if (req.body.name !== undefined) {
        linkedUser.fullName = student.name;
      }
      if (req.body.email !== undefined) {
        linkedUser.email = student.email;
      }
      if (req.body.phone !== undefined) {
        linkedUser.mobile = student.phone;
      }
      if (req.body.password !== undefined) {
        linkedUser.passwordHash = await bcrypt.hash(req.body.password, 10);
      }

      await linkedUser.save();
    }

    const updatedStudent = await Student.findById(id).populate("course");
    return res.status(200).json(updatedStudent);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to update student right now.",
    });
  }
});

app.delete("/api/students/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndDelete(id);

    if (!student) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    await Promise.all([
      Attendance.deleteMany({ studentId: id }),
      Marks.deleteMany({ studentId: id }),
      Fees.deleteMany({ studentId: id }),
      User.deleteOne({
        $or: [{ email: student.email }, { mobile: student.phone }],
        role: "student",
      }),
    ]);

    return res.status(200).json({
      message: "Student deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to delete student right now.",
    });
  }
});

app.get("/api/courses", authMiddleware, async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    return res.status(200).json(courses);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch courses right now.",
    });
  }
});

app.post("/api/courses", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { title, duration, fees } = req.body;

    if (!title || !duration || fees === undefined) {
      return res.status(400).json({
        message: "Title, duration, and fees are required.",
      });
    }

    const course = await Course.create({ title, duration, fees });
    return res.status(201).json(course);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to create course right now.",
    });
  }
});

app.get("/api/attendance", authMiddleware, adminOnly, async (req, res) => {
  try {
    const records = await Attendance.find()
      .populate("studentId", "name")
      .sort({ date: -1, createdAt: -1 });

    return res.status(200).json(records);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch attendance right now.",
    });
  }
});

app.post("/api/attendance", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { studentId, date, status } = req.body;

    if (!studentId || !date || !status) {
      return res.status(400).json({
        message: "studentId, date, and status are required.",
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    const attendance = await Attendance.create({ studentId, date, status });
    student.attendance.push(attendance._id);
    await student.save();

    const populatedAttendance = await Attendance.findById(attendance._id).populate("studentId", "name");
    return res.status(201).json(populatedAttendance);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to save attendance right now.",
    });
  }
});

app.get("/api/marks", authMiddleware, adminOnly, async (req, res) => {
  try {
    const records = await Marks.find()
      .populate("studentId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json(records);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch marks right now.",
    });
  }
});

app.post("/api/marks", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { studentId, subject, marks } = req.body;

    if (!studentId || !subject || marks === undefined) {
      return res.status(400).json({
        message: "studentId, subject, and marks are required.",
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    const marksRecord = await Marks.create({ studentId, subject, marks });
    student.marks.push(marksRecord._id);
    await student.save();

    const populatedMarks = await Marks.findById(marksRecord._id).populate("studentId", "name");
    return res.status(201).json(populatedMarks);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to save marks right now.",
    });
  }
});

app.get("/api/fees", authMiddleware, adminOnly, async (req, res) => {
  try {
    const records = await Fees.find()
      .populate("studentId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json(records);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch fees right now.",
    });
  }
});

app.get("/api/student/dashboard", authMiddleware, async (req, res) => {
  try {
    const student = await findStudentByAuthUser(req.user);

    if (!student) {
      return res.status(404).json({
        message: "Student dashboard data not found for this account.",
      });
    }

    const [attendance, marks, fees] = await Promise.all([
      Attendance.find({ studentId: student._id }).sort({ date: -1, createdAt: -1 }),
      Marks.find({ studentId: student._id }).sort({ createdAt: -1 }),
      Fees.find({ studentId: student._id }).sort({ createdAt: -1 }),
    ]);

    return res.status(200).json({
      student,
      attendance,
      marks,
      fees,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load student dashboard right now.",
    });
  }
});

app.post("/api/fees", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { studentId, amount, status } = req.body;

    if (!studentId || amount === undefined || !status) {
      return res.status(400).json({
        message: "studentId, amount, and status are required.",
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    const feesRecord = await Fees.create({ studentId, amount, status });
    const populatedFees = await Fees.findById(feesRecord._id).populate("studentId", "name");
    return res.status(201).json(populatedFees);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to save fees right now.",
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

async function ensureDemoStudent() {
  const existingStudent = await User.findOne({
    $or: [{ email: demoStudentEmail }, { mobile: demoStudentMobile }],
  });

  if (existingStudent) {
    return;
  }

  const passwordHash = await bcrypt.hash(demoStudentPassword, 10);

  await User.create({
    fullName: demoStudentName,
    email: demoStudentEmail,
    mobile: demoStudentMobile,
    passwordHash,
    role: "student",
  });
}

async function ensureDemoAdmin() {
  const existingAdmin = await User.findOne({
    $or: [{ email: demoAdminEmail }, { mobile: demoAdminMobile }],
  });

  if (existingAdmin) {
    return;
  }

  const passwordHash = await bcrypt.hash(demoAdminPassword, 10);

  await User.create({
    fullName: demoAdminName,
    email: demoAdminEmail,
    mobile: demoAdminMobile,
    passwordHash,
    role: "admin",
  });
}

async function startServer() {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing. Create a .env file first.");
  }

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is missing. Create a .env file first.");
  }

  await mongoose.connect(mongoUri);
  await ensureDemoStudent();
  await ensureDemoAdmin();

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});


