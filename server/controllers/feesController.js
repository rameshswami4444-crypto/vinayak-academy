const Fees = require("../models/Fees");
const Student = require("../models/Student");

async function createFees(req, res) {
  try {
    const { studentId, amount, status } = req.body;

    if (!studentId || amount === undefined || !status) {
      return res.status(400).json({ message: "studentId, amount, and status are required." });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const feesRecord = await Fees.create({ studentId, amount, status });
    return res.status(201).json(feesRecord);
  } catch (error) {
    return res.status(500).json({ message: "Unable to create fees record." });
  }
}

async function getFeesByStudent(req, res) {
  try {
    const student = await Student.findById(req.params.studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const records = await Fees.find({ studentId: req.params.studentId }).sort({ createdAt: -1 });
    return res.status(200).json(records);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch fees records." });
  }
}

module.exports = {
  createFees,
  getFeesByStudent,
};
