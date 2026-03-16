const express = require("express");
const multer = require("multer");
const { uploadFile, getAllFiles, uploadFileByTeacher, viewHandwritingSample, viewAssignment, evaluateAssignment, getStudentAssignments } = require("../controllers/fileController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const router = express.Router();
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    ALLOWED_MIME_TYPES.includes(file.mimetype) ? cb(null, true)
      : cb(new Error("Invalid file type. Only JPEG, PNG, and PDF files are allowed."));
  },
});
router.post("/upload", authMiddleware, requireRole("student"), upload.single("file"),
  (req, res, next) => { if (!req.file) return res.status(400).json({ error: "No file uploaded!" }); next(); }, uploadFile);
router.post("/upload/teacher", authMiddleware, requireRole("teacher"), upload.single("file"), uploadFileByTeacher);
router.get("/all-files", authMiddleware, requireRole("teacher"), getAllFiles);
router.get("/view-assignment/:studentId", authMiddleware, viewAssignment);
router.get("/view-sample/:studentId", authMiddleware, viewHandwritingSample);
router.put("/evaluate/:fileId", authMiddleware, requireRole("teacher"), evaluateAssignment);
router.get("/student-assignments/:studentId", authMiddleware, getStudentAssignments);
module.exports = router;
