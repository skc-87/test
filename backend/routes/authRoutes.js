const express = require("express");
const User = require("../models/User");
const Student = require("../models/Student");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  message: { message: "Too many attempts, please try again later." },
});
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const VALID_ROLES = ["student", "teacher", "librarian"];

router.post("/register", authLimiter, async (req, res) => {
  const { name, email, password, role, mobile_number, department, year } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "Name, email, password, and role are required" });
  }
  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string" || typeof role !== "string") {
    return res.status(400).json({ message: "Invalid input types" });
  }
  if (!isValidEmail(email)) return res.status(400).json({ message: "Invalid email format" });
  if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
  if (password.length > 72) return res.status(400).json({ message: "Password must not exceed 72 characters" });
  if (!VALID_ROLES.includes(role)) return res.status(400).json({ message: "Invalid role" });
  const status = role === "student" ? "approved" : "pending";
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const userExists = await User.findOne({ email }).session(session);
    if (userExists) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await User.create([{ name, email, password, role, status }], { session });
    let studentProfile = null;
    if (role === "student") {
      if (!mobile_number || !department || !year) {
        await session.abortTransaction(); session.endSession();
        return res.status(400).json({ message: "All student fields (mobile_number, department, year) are required" });
      }
      studentProfile = await Student.create([{
        user: user[0]._id, mobile_number, department, year: Number(year),
      }], { session });
    }
    await session.commitTransaction();
    session.endSession();
    const userResponse = {
      _id: user[0]._id, name: user[0].name, email: user[0].email,
      role: user[0].role, status: user[0].status,
    };
    if (status === "pending") {
      return res.status(201).json({
        message: "Registration submitted! Your account is pending admin approval. You will be able to login once approved.",
        user: userResponse, pending: true,
      });
    }
    res.status(201).json({
      message: "User registered successfully", user: userResponse,
      student: studentProfile ? studentProfile[0] : null, token: generateToken(user[0]._id),
    });
  } catch (error) {
    try { await session.abortTransaction(); }
    catch (abortErr) { console.error("Session abort error:", abortErr.message); }
    finally { session.endSession(); }
    console.error("Registration error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
});

router.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
  if (typeof email !== "string" || typeof password !== "string") return res.status(400).json({ message: "Invalid input" });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
    if (user.status === "pending") {
      return res.status(403).json({
        message: "Your account is pending admin approval. Please wait for approval before logging in.",
        pending: true
      });
    }
    if (user.status === "rejected") {
      return res.status(403).json({
        message: "Your registration request was rejected. Please contact the administrator for more information."
      });
    }
    let studentProfile = null;
    if (user.role === "student") studentProfile = await Student.findOne({ user: user._id });
    const userResponse = {
      _id: user._id, name: user.name, email: user.email, role: user.role,
      status: user.status, createdAt: user.createdAt, updatedAt: user.updatedAt
    };
    res.json({
      message: "Login Successful", user: userResponse,
      student: studentProfile, token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login" });
  }
});

module.exports = router;