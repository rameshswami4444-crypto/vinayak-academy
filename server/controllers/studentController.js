const Student = require("../models/Student");
const Course = require("../models/Course");
const Attendance = require("../models/Attendance");
const Marks = require("../models/Marks");
const Fees = require("../models/Fees");

async function getStudents(req, res) {
  try {
    const students = await Student.find()
      .populate("course")
      .populate("attendance")
      .populate("marks")
      .sort({ createdAt: -1 });

    return res.status(200).json(students);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch students." });
  }
}

async function createStudent(req, res) {
  try {
    const { name, email, phone, password, course, fees } = req.body;

    if (!name || !email || !phone || !password || !course || fees === undefined) {
      return res.status(400).json({ message: "All student fields are required." });
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

    const populatedStudent = await Student.findById(student._id)
      .populate("course")
      .populate("attendance")
      .populate("marks");

    return res.status(201).json(populatedStudent);
  } catch (error) {
    return res.status(500).json({ message: "Unable to create student." });
  }
}

async function updateStudent(req, res) {
  try {
    const { id } = req.params;
    const { email, phone, course } = req.body;
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    if (course !== undefined) {
      const existingCourse = await Course.findById(course);

      if (!existingCourse) {
        return res.status(404).json({ message: "Course not found." });
      }
    }

    if (email !== undefined || phone !== undefined) {
      const duplicateStudent = await Student.findOne({
        _id: { $ne: id },
        $or: [
          ...(email !== undefined ? [{ email: String(email).toLowerCase() }] : []),
          ...(phone !== undefined ? [{ phone }] : []),
        ],
      });

      if (duplicateStudent) {
        return res.status(409).json({ message: "Email or phone is already in use." });
      }
    }

    const allowedFields = ["name", "email", "phone", "password", "course", "fees"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        student[field] = req.body[field];
      }
    });

    await student.save();

    const updatedStudent = await Student.findById(id)
      .populate("course")
      .populate("attendance")
      .populate("marks");

    return res.status(200).json(updatedStudent);
  } catch (error) {
    return res.status(500).json({ message: "Unable to update student." });
  }
}

async function deleteStudent(req, res) {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndDelete(id);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    await Promise.all([
      Attendance.deleteMany({ studentId: id }),
      Marks.deleteMany({ studentId: id }),
      Fees.deleteMany({ studentId: id }),
    ]);

    return res.status(200).json({ message: "Student deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete student." });
  }
}

module.exports = {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
};
