const mongoose = require("mongoose");
const File = require("../models/File");
const User = require("../models/User");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const VALID_FILE_CATEGORIES = ["handwriting_sample", "assignment"];
const sanitizeFilename = (name) => (name || "file").replace(/[^a-zA-Z0-9._-]/g, "_");

exports.uploadFile = async (req, res) => {
  const { fileCategory } = req.body;
  const studentId = req.user?.id;
  if (!fileCategory || !VALID_FILE_CATEGORIES.includes(fileCategory)) {
    return res.status(400).json({ message: "Invalid file category. Must be 'handwriting_sample' or 'assignment'." });
  }
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  try {
    const user = await User.findById(studentId).select("name");
    const studentName = user ? user.name : "Unknown";
    const newFile = new File({
      studentId, studentName, fileCategory,
      fileName: req.file.originalname, contentType: req.file.mimetype,
      fileData: req.file.buffer, uploadDate: new Date()
    });
    await newFile.save();
    const { fileData, ...fileMeta } = newFile.toObject();
    res.status(201).json({ message: "File uploaded successfully!", file: fileMeta });
  } catch (error) {
    console.error("Upload error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.uploadFileByTeacher = async (req, res) => {
  const { fileCategory, studentName, studentId } = req.body;
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  if (!fileCategory || !VALID_FILE_CATEGORIES.includes(fileCategory)) {
    return res.status(400).json({ message: "Invalid file category. Must be 'handwriting_sample' or 'assignment'." });
  }
  if (!studentId && !studentName) {
    return res.status(400).json({ message: "Either studentId or studentName must be provided." });
  }
  try {
    let student;
    if (studentId && studentName) {
      student = await User.findOne({ _id: studentId, name: studentName, role: "student" });
    } else if (studentId) {
      student = await User.findOne({ _id: studentId, role: "student" });
    } else {
      const matches = await User.find({ name: studentName, role: "student" }).select("_id name").limit(2);
      if (matches.length > 1) {
        return res.status(400).json({ message: "Multiple students with this name. Please provide studentId to disambiguate." });
      }
      student = matches[0] || null;
    }
    if (!student) return res.status(404).json({ message: "Student not found or not a student." });
    if (fileCategory === "handwriting_sample") {
      const existingSample = await File.findOne({ studentId: student._id, fileCategory });
      if (existingSample) {
        existingSample.fileData = req.file.buffer;
        existingSample.fileName = req.file.originalname;
        existingSample.contentType = req.file.mimetype;
        existingSample.studentName = student.name;
        existingSample.uploadDate = new Date();
        await existingSample.save();
        const { fileData: _fd, ...sampleMeta } = existingSample.toObject();
        return res.status(200).json({ message: "Handwriting sample updated by teacher.", file: sampleMeta });
      }
    }
    const newFile = new File({
      studentId: student._id, studentName: student.name, fileCategory,
      fileName: req.file.originalname, contentType: req.file.mimetype,
      fileData: req.file.buffer, uploadDate: new Date()
    });
    await newFile.save();
    const { fileData: _fd2, ...teacherFileMeta } = newFile.toObject();
    res.status(201).json({ message: "File uploaded by teacher successfully!", file: teacherFileMeta });
  } catch (error) {
    console.error("Teacher upload error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getAllFiles = async (req, res) => {
  try {
    const files = await File.find().select("-fileData");
    const handwritingSamples = files.filter(f => f.fileCategory === "handwriting_sample");
    const assignments = files.filter(f => f.fileCategory === "assignment");
    res.status(200).json({ handwritingSamples, assignments });
  } catch (error) {
    console.error("Fetch files error:", error.message);
    res.status(500).json({ message: "Failed to fetch files" });
  }
};

exports.viewAssignment = async (req, res) => {
  const { studentId } = req.params;
  if (req.user.role !== "teacher" && (req.user.role !== "student" || req.user.id !== studentId)) {
    return res.status(403).json({ error: "Access denied" });
  }
  try {
    const assignment = await File.findOne({ studentId, fileCategory: "assignment" }).sort({ uploadDate: -1 });
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });
    res.set({
      "Content-Type": assignment.contentType,
      "Content-Disposition": `inline; filename="${sanitizeFilename(assignment.fileName)}"`,
    });
    res.send(assignment.fileData);
  } catch (error) {
    res.status(500).json({ error: "Server error while downloading" });
  }
};

exports.viewHandwritingSample = async (req, res) => {
  const { studentId } = req.params;
  if (req.user.role !== "teacher" && (req.user.role !== "student" || req.user.id !== studentId)) {
    return res.status(403).json({ error: "Access denied" });
  }
  try {
    const sample = await File.findOne({ studentId, fileCategory: "handwriting_sample" }).sort({ uploadDate: -1 });
    if (!sample) return res.status(404).json({ error: "Handwriting sample not found" });
    res.set({
      "Content-Type": sample.contentType,
      "Content-Disposition": `inline; filename="${sanitizeFilename(sample.fileName)}"`,
    });
    res.send(sample.fileData);
  } catch (error) {
    res.status(500).json({ error: "Server error while viewing sample" });
  }
};

exports.evaluateAssignment = async (req, res) => {
  const { fileId } = req.params;
  const { marks } = req.body;
  if (!isValidObjectId(fileId)) return res.status(400).json({ message: "Invalid file ID" });
  if (marks === undefined || marks === null) return res.status(400).json({ message: "Marks are required" });
  const marksNum = Number(marks);
  if (isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
    return res.status(400).json({ message: "Marks must be a number between 0 and 100" });
  }
  try {
    const updatedFile = await File.findByIdAndUpdate(fileId, { $set: { marks: String(marksNum) } }, { new: true }).select("-fileData");
    if (!updatedFile) return res.status(404).json({ message: "Assignment not found" });
    res.status(200).json({ message: "Marks added successfully", file: updatedFile });
  } catch (error) {
    console.error("Evaluate error:", error.message);
    res.status(500).json({ message: "Failed to evaluate assignment" });
  }
};

exports.getStudentAssignments = async (req, res) => {
  const { studentId } = req.params;
  if (req.user.role !== "teacher" && (req.user.role !== "student" || req.user.id !== studentId)) {
    return res.status(403).json({ message: "Access denied" });
  }
  try {
    const files = await File.find({ studentId, fileCategory: 'assignment' }).select("-fileData").sort({ uploadDate: -1 });
    res.json(files);
  } catch (error) {
    console.error("Student assignments error:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};