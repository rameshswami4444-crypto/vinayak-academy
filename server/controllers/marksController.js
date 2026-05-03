const Marks = require("../models/Marks");
const Student = require("../models/Student");

async function createMarks(req, res) {
  try {
    const { studentId, subject, marks } = req.body;

    if (!studentId || !subject || marks === undefined) {
      return res.status(400).json({ message: "studentId, subject, and marks are required." });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const marksRecord = await Marks.create({ studentId, subject, marks });
    student.marks.push(marksRecord._id);
    await student.save();

    return res.status(201).json(marksRecord);
  } catch (error) {
    return res.status(500).json({ message: "Unable to create marks." });
  }
}

async function getMarksByStudent(req, res) {
  try {
    const student = await Student.findById(req.params.studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const records = await Marks.find({ studentId: req.params.studentId }).sort({ createdAt: -1 });
    return res.status(200).json(records);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch marks." });
  }
}

module.exports = {
  createMarks,
  getMarksByStudent,
};
