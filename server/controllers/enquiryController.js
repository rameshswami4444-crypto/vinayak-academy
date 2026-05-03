const Enquiry = require("../models/Enquiry");

async function createEnquiry(req, res) {
  try {
    const { name, phone, email, course } = req.body;

    if (!name || !phone || !email || !course) {
      return res.status(400).json({ message: "All enquiry fields are required." });
    }

    const enquiry = await Enquiry.create({ name, phone, email, course });
    return res.status(201).json(enquiry);
  } catch (error) {
    return res.status(500).json({ message: "Unable to create enquiry." });
  }
}

async function getEnquiries(req, res) {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    return res.status(200).json(enquiries);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch enquiries." });
  }
}

module.exports = {
  createEnquiry,
  getEnquiries,
};
