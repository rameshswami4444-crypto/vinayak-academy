const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const Course = require("../models/Course");

function generateToken(student) {
  return jwt.sign(
    {
      id: student._id,
      email: student.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function register(req, res) {
  try {
    const { name, email, phone, password, course, fees } = req.body;

    if (!name || !email || !phone || !password || !course || fees === undefined) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingCourse = await Course.findById(course);

    if (!existingCourse) {
      return res.status(404).json({ message: "Course not found." });
    }

    const existingStudent = await Student.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });

    if (existingStudent) {
      return res.status(409).json({ message: "Student already exists." });
    }

    const student = await Student.create({
      name,
      email,
      phone,
      password,
      course,
      fees,
    });

    const populatedStudent = await Student.findById(student._id).populate("course");

    return res.status(201).json({
      message: "Registration successful.",
      token: generateToken(student),
      student: populatedStudent,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to register student." });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const student = await Student.findOne({ email: email.toLowerCase() }).populate("course");

    if (!student) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isValidPassword = await student.comparePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    return res.status(200).json({
      message: "Login successful.",
      token: generateToken(student),
      student,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to login." });
  }
}

module.exports = {
  register,
  login,
};
