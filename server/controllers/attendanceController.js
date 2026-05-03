const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

async function createAttendance(req, res) {
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

    return res.status(201).json(attendance);
  } catch (error) {
    return res.status(500).json({ message: "Unable to create attendance." });
  }
}

async function getAttendanceByStudent(req, res) {
  try {
    const student = await Student.findById(req.params.studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const records = await Attendance.find({ studentId: req.params.studentId }).sort({ date: -1 });
    return res.status(200).json(records);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch attendance." });
  }
}

module.exports = {
  createAttendance,
  getAttendanceByStudent,
};
