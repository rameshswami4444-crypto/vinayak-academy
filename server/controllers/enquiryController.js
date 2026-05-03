import Enquiry from "../models/Enquiry.js";

export async function createEnquiry(req, res) {
  try {
    const { name, phone, email, course } = req.body;

    if (!name || !phone || !email || !course) {
      return res.status(400).json({ message: "All enquiry fields are required." });
    }

    const enquiry = await Enquiry.create({
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: String(email).trim().toLowerCase(),
      course: String(course).trim(),
    });

    return res.status(201).json({
      message: "Enquiry submitted successfully.",
      enquiry,
    });
  } catch (error) {
    console.error("Create enquiry failed:", error);
    return res.status(500).json({ message: "Unable to create enquiry." });
  }
}

export async function getEnquiries(_req, res) {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    return res.status(200).json(enquiries);
  } catch (error) {
    console.error("Get enquiries failed:", error);
    return res.status(500).json({ message: "Unable to fetch enquiries." });
  }
}
