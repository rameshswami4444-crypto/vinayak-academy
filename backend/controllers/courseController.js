import Course from "../models/Course.js";

export async function getCourses(_req, res) {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    return res.status(200).json(courses);
  } catch (error) {
    console.error("Get courses failed:", error);
    return res.status(500).json({ message: "Unable to fetch courses." });
  }
}

export async function createCourse(req, res) {
  try {
    const { title, duration, fees } = req.body;

    if (!title || !duration || fees === undefined) {
      return res.status(400).json({ message: "Title, duration, and fees are required." });
    }

    const normalizedTitle = String(title).trim();
    const existingCourse = await Course.findOne({ title: normalizedTitle });

    if (existingCourse) {
      return res.status(409).json({ message: "Course already exists." });
    }

    const course = await Course.create({
      title: normalizedTitle,
      duration: String(duration).trim(),
      fees,
    });

    return res.status(201).json(course);
  } catch (error) {
    console.error("Create course failed:", error);
    return res.status(500).json({ message: "Unable to create course." });
  }
}
