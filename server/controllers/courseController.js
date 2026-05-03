const Course = require("../models/Course");

async function getCourses(req, res) {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    return res.status(200).json(courses);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch courses." });
  }
}

async function createCourse(req, res) {
  try {
    const { title, duration, fees } = req.body;

    if (!title || !duration || fees === undefined) {
      return res.status(400).json({ message: "Title, duration, and fees are required." });
    }

    const existingCourse = await Course.findOne({ title: title.trim() });

    if (existingCourse) {
      return res.status(409).json({ message: "Course already exists." });
    }

    const course = await Course.create({ title, duration, fees });
    return res.status(201).json(course);
  } catch (error) {
    return res.status(500).json({ message: "Unable to create course." });
  }
}

module.exports = {
  getCourses,
  createCourse,
};
