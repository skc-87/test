const mongoose = require("mongoose");
const User = require("../models/User");
const VALID_IMAGE_REGEX = /^data:image\/(jpeg|jpg|png);base64,/;
const VALID_ID_REGEX = /^[a-zA-Z0-9]+$/;
const VALID_NAME_REGEX = /^[a-zA-Z\s.'-]{1,100}$/;
const ALLOWED_EXTS = ["jpeg", "jpg", "png"];
const FACE_SERVICE_URL = process.env.FACE_SERVICE_URL;

const fetchWithTimeout = async (url, options = {}, timeoutMs = 60000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
};

const callFaceService = async (endpoint, payload, authToken, timeoutMs = 60000) => {
  if (!FACE_SERVICE_URL) {
    return { success: false, message: "Face service is not configured." };
  }
  try {
    const response = await fetchWithTimeout(`${FACE_SERVICE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken || ""}`,
      },
      body: JSON.stringify(payload || {}),
    }, timeoutMs);
    const data = await response.json().catch(() => ({ success: false, message: "Invalid response from face service." }));
    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      return { success: false, message: "Face service timed out." };
    }
    return { success: false, message: "Failed to reach face service." };
  }
};

const faceController = {
  registerFace: async (req, res) => {
    try {
      const { name, image } = req.body;
      let { student_id } = req.body;
      const token = req.headers.authorization?.split(" ")[1] || "";
      if (student_id) student_id = student_id.trim();
      if (!student_id || !name || !image || !token) {
        return res.status(400).json({ success: false, message: "Missing fields" });
      }
      if (!mongoose.Types.ObjectId.isValid(student_id)) {
        return res.status(400).json({ success: false, message: "Invalid student ID. Please use the student's system ID." });
      }
      if (!VALID_ID_REGEX.test(student_id)) {
        return res.status(400).json({ success: false, message: "Invalid student ID format" });
      }
      if (!VALID_NAME_REGEX.test(name)) {
        return res.status(400).json({ success: false, message: "Invalid name format" });
      }
      if (!VALID_IMAGE_REGEX.test(image)) {
        return res.status(400).json({ success: false, message: "Invalid image" });
      }
      if (!mongoose.Types.ObjectId.isValid(student_id)) {
        return res.status(400).json({ success: false, message: "Invalid student ID. Please use the student's system ID." });
      }
      const studentUser = await User.findOne({ _id: student_id, role: "student", status: "approved" });
      if (!studentUser) {
        return res.status(404).json({ success: false, message: "Student not found. Please verify the ID belongs to an approved student." });
      }
      if (studentUser.name.toLowerCase().trim() !== name.toLowerCase().trim()) {
        return res.status(400).json({ success: false, message: `Name mismatch. The registered name for this ID is "${studentUser.name}".` });
      }
      const ext = image.split(";")[0].split("/")[1];
      if (!ALLOWED_EXTS.includes(ext)) {
        return res.status(400).json({ success: false, message: "Invalid image type" });
      }
      const result = await callFaceService("/register-face", { student_id, name, image }, token, 90000);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (err) {
      console.error("[REGISTER ERROR]", err.message);
      return res.status(500).json({ success: false, message: "Face registration failed" });
    }
  },

  takeAttendance: async (req, res) => {
    try {
      const { subject, image, date } = req.body;
      const token = req.headers.authorization?.split(" ")[1] || "";
      if (!subject || !image || !date || !token) {
        return res.status(400).json({ success: false, message: "Missing fields" });
      }
      if (typeof subject !== "string" || subject.length > 100 || !/^[a-zA-Z0-9\s._-]+$/.test(subject)) {
        return res.status(400).json({ success: false, message: "Invalid subject format" });
      }
      if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ success: false, message: "Invalid date format. Use YYYY-MM-DD" });
      }
      if (!VALID_IMAGE_REGEX.test(image)) {
        return res.status(400).json({ success: false, message: "Invalid image" });
      }
      const ext = image.split(";")[0].split("/")[1];
      if (!ALLOWED_EXTS.includes(ext)) {
        return res.status(400).json({ success: false, message: "Invalid image type" });
      }
      const result = await callFaceService("/take-attendance", { subject, image, date }, token, 60000);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (err) {
      console.error("[ATTENDANCE ERROR]", err.message);
      return res.status(500).json({ success: false, message: "Attendance processing failed" });
    }
  },
};

module.exports = faceController;