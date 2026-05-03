import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Course from "../models/Course.js";
import Attendance from "../models/Attendance.js";
import Marks from "../models/Marks.js";
import Fees from "../models/Fees.js";

async function findStudentByAuthUser(user) {
  if (!user?.email) {
    return null;
  }

  return Student.findOne({ email: String(user.email).toLowerCase() }).populate("course");
}

export async function getStudents(_req, res) {
  try {
    const students = await Student.find()
      .populate("course")
      .populate("attendance")
      .populate("marks")
      .sort({ createdAt: -1 });

    return res.status(200).json(students);
  } catch (error) {
    console.error("Get students failed:", error);
    return res.status(500).json({ message: "Unable to fetch students." });
  }
}

export async function createStudent(req, res) {
  try {
    const { name, email, phone, password, course, fees } = req.body;

    if (!name || !email || !phone || !password || !course || fees === undefined) {
      return res.status(400).json({ message: "All student fields are required." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = String(phone).trim();
    const existingCourse = await Course.findById(course);

    if (!existingCourse) {
      return res.status(404).json({ message: "Course not found." });
    }

    const [existingStudent, existingUser] = await Promise.all([
      Student.findOne({
        $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
      }),
      User.findOne({
        $or: [{ email: normalizedEmail }, { mobile: normalizedPhone }],
      }),
    ]);

    if (existingStudent) {
      return res.status(409).json({ message: "Student already exists." });
    }

    if (existingUser) {
      return res.status(409).json({
        message: "A login account already exists with this email or mobile number.",
      });
    }

    const student = await Student.create({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password,
      course,
      fees,
    });

    await User.create({
      fullName: student.name,
      email: normalizedEmail,
      mobile: normalizedPhone,
      passwordHash: await bcrypt.hash(password, 10),
      role: "student",
    });

    const populatedStudent = await Student.findById(student._id)
      .populate("course")
      .populate("attendance")
      .populate("marks");

    return res.status(201).json(populatedStudent);
  } catch (error) {
    console.error("Create student failed:", error);
    return res.status(500).json({ message: "Unable to create student." });
  }
}

export async function updateStudent(req, res) {
  try {
    const { id } = req.params;
    const { email, phone, course, password } = req.body;
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const previousEmail = student.email;
    const previousPhone = student.phone;
    const normalizedEmail = email === undefined ? undefined : String(email).trim().toLowerCase();
    const normalizedPhone = phone === undefined ? undefined : String(phone).trim();

    if (course !== undefined) {
      const existingCourse = await Course.findById(course);

      if (!existingCourse) {
        return res.status(404).json({ message: "Course not found." });
      }
    }

    if (normalizedEmail !== undefined || normalizedPhone !== undefined) {
      const [duplicateStudent, duplicateUser] = await Promise.all([
        Student.findOne({
          _id: { $ne: id },
          $or: [
            ...(normalizedEmail !== undefined ? [{ email: normalizedEmail }] : []),
            ...(normalizedPhone !== undefined ? [{ phone: normalizedPhone }] : []),
          ],
        }),
        User.findOne({
          $or: [
            ...(normalizedEmail !== undefined ? [{ email: normalizedEmail }] : []),
            ...(normalizedPhone !== undefined ? [{ mobile: normalizedPhone }] : []),
          ],
          email: { $ne: previousEmail },
          mobile: { $ne: previousPhone },
        }),
      ]);

      if (duplicateStudent || duplicateUser) {
        return res.status(409).json({ message: "Email or phone is already in use." });
      }
    }

    const allowedFields = ["name", "course", "fees"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        student[field] = req.body[field];
      }
    });

    if (normalizedEmail !== undefined) {
      student.email = normalizedEmail;
    }

    if (normalizedPhone !== undefined) {
      student.phone = normalizedPhone;
    }

    if (password !== undefined) {
      student.password = password;
    }

    await student.save();

    const linkedUser = await User.findOne({
      role: "student",
      $or: [{ email: previousEmail }, { mobile: previousPhone }],
    });

    if (linkedUser) {
      linkedUser.fullName = student.name;
      linkedUser.email = student.email;
      linkedUser.mobile = student.phone;

      if (password !== undefined) {
        linkedUser.passwordHash = await bcrypt.hash(password, 10);
      }

      await linkedUser.save();
    }

    const updatedStudent = await Student.findById(id)
      .populate("course")
      .populate("attendance")
      .populate("marks");

    return res.status(200).json(updatedStudent);
  } catch (error) {
    console.error("Update student failed:", error);
    return res.status(500).json({ message: "Unable to update student." });
  }
}

export async function deleteStudent(req, res) {
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
      User.deleteOne({
        role: "student",
        $or: [{ email: student.email }, { mobile: student.phone }],
      }),
    ]);

    return res.status(200).json({ message: "Student deleted successfully." });
  } catch (error) {
    console.error("Delete student failed:", error);
    return res.status(500).json({ message: "Unable to delete student." });
  }
}

export async function getStudentDashboard(req, res) {
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
    console.error("Get student dashboard failed:", error);
    return res.status(500).json({ message: "Unable to load student dashboard." });
  }
}
