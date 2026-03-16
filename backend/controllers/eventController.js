const crypto = require("crypto");
const QRCode = require("qrcode");
const Event = require("../models/Event");
const EventPass = require("../models/EventPass");
const User = require("../models/User");

const generateEventId = () => `EVT${Date.now()}${crypto.randomBytes(4).toString('hex')}`.toUpperCase();
const generatePassId = () => `PASS${Date.now()}${crypto.randomBytes(4).toString('hex')}`.toUpperCase();

const eventController = {
  createEvent: async (req, res) => {
    try {
      const { title, description, date, time, venue, organizer } = req.body;
      const createdBy = req.user.id;
      if (!title || !date || !time || !venue || !organizer) {
        return res.status(400).json({ success: false, message: "Missing required fields: title, date, time, venue, and organizer are required" });
      }
      if (typeof title !== 'string' || title.length > 200) {
        return res.status(400).json({ success: false, message: "Title must be a string (max 200 chars)" });
      }
      if (description && (typeof description !== 'string' || description.length > 2000)) {
        return res.status(400).json({ success: false, message: "Description too long (max 2000 chars)" });
      }
      if (typeof venue !== 'string' || venue.length > 200) {
        return res.status(400).json({ success: false, message: "Venue must be a string (max 200 chars)" });
      }
      if (typeof organizer !== 'string' || organizer.length > 200) {
        return res.status(400).json({ success: false, message: "Organizer must be a string (max 200 chars)" });
      }
      if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date))) {
        return res.status(400).json({ success: false, message: "Date must be a valid date in YYYY-MM-DD format" });
      }
      if (typeof time !== 'string' || !/^\d{2}:\d{2}/.test(time)) {
        return res.status(400).json({ success: false, message: "Time must be in HH:MM format" });
      }
      const eventId = generateEventId();
      const qrData = {
        eventId, type: "event_info",
        title: title.substring(0, 50), date, time, venue: venue.substring(0, 30)
      };
      const qrCodeString = JSON.stringify(qrData);
      const event = await Event.create({
        title, description, date, time, venue, organizer,
        qrCode: qrCodeString, eventId, createdBy
      });
      res.status(201).json({ success: true, message: "Event created successfully", event });
    } catch (error) {
      console.error("Event creation error:", error.message);
      res.status(500).json({ success: false, message: "Failed to create event" });
    }
  },

  generatePasses: async (req, res) => {
    try {
      const { eventId } = req.params;
      const { studentIds } = req.body;
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ success: false, message: "studentIds must be a non-empty array" });
      }
      if (studentIds.length > 500) {
        return res.status(400).json({ success: false, message: "Cannot generate more than 500 passes at once" });
      }
      const event = await Event.findOne({ eventId });
      if (!event) return res.status(404).json({ success: false, message: "Event not found" });
      const passes = [];
      const errors = [];
      const studentsMap = new Map();
      const existingPassesMap = new Map();
      const [students, existingPasses] = await Promise.all([
        User.find({ _id: { $in: studentIds } }).select("_id name email"),
        EventPass.find({ eventId: event._id, studentId: { $in: studentIds } }).populate("studentId", "name email"),
      ]);
      for (const s of students) studentsMap.set(s._id.toString(), s);
      for (const p of existingPasses) existingPassesMap.set(p.studentId?._id?.toString() || p.studentId?.toString(), p);
      for (const studentId of studentIds) {
        try {
          const student = studentsMap.get(studentId.toString());
          if (!student) { errors.push(`Student not found: ${studentId}`); continue; }
          const existingPass = existingPassesMap.get(studentId.toString());
          if (existingPass) { passes.push(existingPass); continue; }
          const passId = generatePassId();
          const passData = {
            eventId: event.eventId, passId, studentId: studentId.toString(),
            studentName: student.name.substring(0, 30), type: "event_pass"
          };
          const qrCodeString = JSON.stringify(passData);
          const pass = await EventPass.create({ eventId: event._id, studentId, qrCode: qrCodeString, passId });
          const populatedPass = await EventPass.findById(pass._id).populate('studentId', 'name email');
          passes.push(populatedPass);
        } catch (error) {
          console.error(`Error creating pass for student ${studentId}:`, error.message);
          errors.push(`Failed to create pass for student ${studentId}`);
        }
      }
      res.json({
        success: true, message: `Generated ${passes.length} passes successfully`,
        passes, errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Pass generation error:", error.message);
      res.status(500).json({ success: false, message: "Failed to generate passes" });
    }
  },

  validateQR: async (req, res) => {
    try {
      const { qrData } = req.body;
      const scannedBy = req.user.id;
      let parsedData;
      try { parsedData = JSON.parse(qrData); }
      catch (error) { return res.status(400).json({ valid: false, message: "Invalid QR code format" }); }
      const { type, eventId, passId } = parsedData;
      if (type === "event_pass") {
        const pass = await EventPass.findOne({ passId }).populate('eventId').populate('studentId', 'name email');
        if (!pass) return res.json({ valid: false, message: "Invalid pass" });
        if (!pass.studentId || !pass.eventId) {
          return res.json({ valid: false, message: "Pass data is incomplete — referenced student or event may have been deleted" });
        }
        if (pass.isUsed) return res.json({ valid: false, message: "Pass already used" });
        pass.isUsed = true;
        pass.usedAt = new Date();
        pass.scannedBy = scannedBy;
        await pass.save();
        return res.json({
          valid: true, message: "Pass validated successfully",
          data: {
            studentName: pass.studentId.name, studentEmail: pass.studentId.email,
            eventTitle: pass.eventId.title, eventDate: pass.eventId.date,
            eventTime: pass.eventId.time, venue: pass.eventId.venue
          }
        });
      } else if (type === "event_info") {
        const event = await Event.findOne({ eventId });
        if (!event) return res.json({ valid: false, message: "Event not found" });
        return res.json({
          valid: true, message: "Event QR code",
          data: {
            eventTitle: event.title, eventDate: event.date,
            eventTime: event.time, venue: event.venue, organizer: event.organizer
          }
        });
      } else {
        return res.json({ valid: false, message: "Unknown QR code type" });
      }
    } catch (error) {
      console.error("QR validation error:", error.message);
      res.status(500).json({ valid: false, message: "Validation error" });
    }
  },

  getAllEvents: async (req, res) => {
    try {
      const events = await Event.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
      res.json({ success: true, events });
    } catch (error) {
      console.error("Get events error:", error.message);
      res.status(500).json({ success: false, message: "Failed to fetch events" });
    }
  },

  getEventPasses: async (req, res) => {
    try {
      const { eventId } = req.params;
      const event = await Event.findOne({ eventId });
      if (!event) return res.status(404).json({ success: false, message: "Event not found" });
      const passes = await EventPass.find({ eventId: event._id })
        .populate('studentId', 'name email').populate('scannedBy', 'name').sort({ createdAt: -1 });
      res.json({ success: true, passes });
    } catch (error) {
      console.error("Get passes error:", error.message);
      res.status(500).json({ success: false, message: "Failed to fetch passes" });
    }
  },

  getAllStudents: async (req, res) => {
    try {
      const students = await User.find({ role: 'student', status: 'approved' }).select('_id name email').sort({ name: 1 });
      res.json({ success: true, students });
    } catch (error) {
      console.error("Get students error:", error.message);
      res.status(500).json({ success: false, message: "Failed to fetch students" });
    }
  }
};

module.exports = eventController;