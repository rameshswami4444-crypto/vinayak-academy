import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

function createToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function buildUserResponse(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
  };
}

export async function register(req, res) {
  try {
    const { fullName, email, mobile, password } = req.body;

    if (!fullName || !email || !mobile || !password) {
      return res.status(400).json({
        message: "Full name, email, mobile, and password are required.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedMobile = String(mobile).trim();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { mobile: normalizedMobile }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists with this email or mobile number.",
      });
    }

    const user = await User.create({
      fullName: String(fullName).trim(),
      email: normalizedEmail,
      mobile: normalizedMobile,
      passwordHash: await bcrypt.hash(password, 10),
      role: "student",
    });

    return res.status(201).json({
      message: "Account created successfully.",
      token: createToken(user),
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error("Register failed:", error);
    return res.status(500).json({ message: "Unable to create account right now." });
  }
}

export async function login(req, res) {
  try {
    const { identifier, password, role, accessCode } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Email or mobile and password are required." });
    }

    const normalizedIdentifier = String(identifier).trim();
    const normalizedEmail = normalizedIdentifier.toLowerCase();
    const requestedRole = role === "admin" ? "admin" : "student";

    const user = await User.findOne({
      role: requestedRole,
      $or: [{ email: normalizedEmail }, { mobile: normalizedIdentifier }],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid login credentials." });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid login credentials." });
    }

    if (requestedRole === "admin" && process.env.ADMIN_ACCESS_CODE && accessCode !== process.env.ADMIN_ACCESS_CODE) {
      return res.status(401).json({ message: "Invalid admin access code." });
    }

    return res.status(200).json({
      message: "Login successful.",
      token: createToken(user),
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ message: "Unable to login right now." });
  }
}

export async function ensureDefaultAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME?.trim();
  const adminMobile = process.env.ADMIN_MOBILE?.trim();

  if (!adminEmail || !adminPassword || !adminName || !adminMobile) {
    return;
  }

  const existingAdmin = await User.findOne({
    $or: [{ email: adminEmail }, { mobile: adminMobile }],
  });

  if (existingAdmin) {
    if (existingAdmin.role !== "admin") {
      existingAdmin.role = "admin";
      await existingAdmin.save();
    }
    return;
  }

  await User.create({
    fullName: adminName,
    email: adminEmail,
    mobile: adminMobile,
    passwordHash: await bcrypt.hash(adminPassword, 10),
    role: "admin",
  });
}
