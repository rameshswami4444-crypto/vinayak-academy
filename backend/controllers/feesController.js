import Fees from "../models/Fees.js";
import Student from "../models/Student.js";

export async function getFees(_req, res) {
  try {
    const records = await Fees.find()
      .populate("studentId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json(records);
  } catch (error) {
    console.error("Get fees failed:", error);
    return res.status(500).json({ message: "Unable to fetch fees records." });
  }
}

export async function createFees(req, res) {
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
    const populatedFees = await Fees.findById(feesRecord._id).populate("studentId", "name");
    return res.status(201).json(populatedFees);
  } catch (error) {
    console.error("Create fees failed:", error);
    return res.status(500).json({ message: "Unable to create fees record." });
  }
}

export async function getFeesByStudent(req, res) {
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

    const records = await Fees.find({ studentId: requestedStudentId }).sort({ createdAt: -1 });
    return res.status(200).json(records);
  } catch (error) {
    console.error("Get fees by student failed:", error);
    return res.status(500).json({ message: "Unable to fetch fees records." });
  }
}
