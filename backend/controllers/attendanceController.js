import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";

export async function getAttendance(_req, res) {
  try {
    const records = await Attendance.find()
      .populate("studentId", "name")
      .sort({ date: -1, createdAt: -1 });

    return res.status(200).json(records);
  } catch (error) {
    console.error("Get attendance failed:", error);
    return res.status(500).json({ message: "Unable to fetch attendance." });
  }
}

export async function createAttendance(req, res) {
  try {
    const { studentId, date, status } = req.body;

    if (!studentId || !date || !status) {
      return res.status(400).json({ message: "studentId, date, and status are required." });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const attendance = await Attendance.create({ studentId, date, status });
    student.attendance.push(attendance._id);
    await student.save();

    const populatedAttendance = await Attendance.findById(attendance._id).populate("studentId", "name");
    return res.status(201).json(populatedAttendance);
  } catch (error) {
    console.error("Create attendance failed:", error);
    return res.status(500).json({ message: "Unable to create attendance." });
  }
}

export async function getAttendanceByStudent(req, res) {
  try {
    const requestedStudentId = req.params.studentId;
    let student;

    if (req.user?.role === "admin") {
      student = await Student.findById(requestedStudentId);
    } else {
      student = await Student.findOne({
        _id: requestedStudentId,
        email: String(req.user?.email || "").toLowerCase(),
      });
    }

    if (!student) {
      return res.status(404).json({ message: "Student not found or access denied." });
    }

    const records = await Attendance.find({ studentId: requestedStudentId }).sort({ date: -1, createdAt: -1 });
    return res.status(200).json(records);
  } catch (error) {
    console.error("Get attendance by student failed:", error);
    return res.status(500).json({ message: "Unable to fetch attendance." });
  }
}
