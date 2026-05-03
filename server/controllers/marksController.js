import Marks from "../models/Marks.js";
import Student from "../models/Student.js";

export async function getMarks(_req, res) {
  try {
    const records = await Marks.find()
      .populate("studentId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json(records);
  } catch (error) {
    console.error("Get marks failed:", error);
    return res.status(500).json({ message: "Unable to fetch marks." });
  }
}

export async function createMarks(req, res) {
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

    const populatedMarks = await Marks.findById(marksRecord._id).populate("studentId", "name");
    return res.status(201).json(populatedMarks);
  } catch (error) {
    console.error("Create marks failed:", error);
    return res.status(500).json({ message: "Unable to create marks." });
  }
}

export async function getMarksByStudent(req, res) {
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

    const records = await Marks.find({ studentId: requestedStudentId }).sort({ createdAt: -1 });
    return res.status(200).json(records);
  } catch (error) {
    console.error("Get marks by student failed:", error);
    return res.status(500).json({ message: "Unable to fetch marks." });
  }
}
