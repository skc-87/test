const Event = require("../models/Event");
const EventPass = require("../models/EventPass");
const User = require("../models/User");

const studentEventController = {
  getStudentEventPasses: async (req, res) => {
    try {
      const studentId = req.user.id;
      const passes = await EventPass.find({ studentId })
        .populate({ path: 'eventId', select: 'title description date time venue organizer eventId status' })
        .sort({ createdAt: -1 });
      const formattedPasses = passes.filter(pass => pass.eventId).map(pass => ({
        passId: pass.passId, qrCode: pass.qrCode, isUsed: pass.isUsed, usedAt: pass.usedAt,
        event: {
          eventId: pass.eventId.eventId, title: pass.eventId.title, description: pass.eventId.description,
          date: pass.eventId.date, time: pass.eventId.time, venue: pass.eventId.venue,
          organizer: pass.eventId.organizer, status: pass.eventId.status
        }
      }));
      res.json({ success: true, passes: formattedPasses, count: formattedPasses.length });
    } catch (error) {
      console.error("Get student event passes error:", error.message);
      res.status(500).json({ success: false, message: "Failed to fetch your event passes" });
    }
  },

  getStudentEventDetails: async (req, res) => {
    try {
      const { eventId } = req.params;
      const studentId = req.user.id;
      const event = await Event.findOne({ eventId });
      if (!event) return res.status(404).json({ success: false, message: "Event not found" });
      const pass = await EventPass.findOne({ eventId: event._id, studentId });
      if (!pass) return res.status(403).json({ success: false, message: "You don't have access to this event" });
      res.json({
        success: true,
        event: {
          eventId: event.eventId, title: event.title, description: event.description,
          date: event.date, time: event.time, venue: event.venue,
          organizer: event.organizer, status: event.status, createdAt: event.createdAt
        },
        pass: { passId: pass.passId, isUsed: pass.isUsed, usedAt: pass.usedAt }
      });
    } catch (error) {
      console.error("Get student event details error:", error.message);
      res.status(500).json({ success: false, message: "Failed to fetch event details" });
    }
  },

  getStudentEventPassQR: async (req, res) => {
    try {
      const { eventId } = req.params;
      const studentId = req.user.id;
      const event = await Event.findOne({ eventId });
      if (!event) return res.status(404).json({ success: false, message: "Event not found" });
      const pass = await EventPass.findOne({ eventId: event._id, studentId })
        .populate('eventId', 'title date time venue');
      if (!pass) return res.status(403).json({ success: false, message: "You don't have a pass for this event" });
      if (!pass.eventId) return res.status(404).json({ success: false, message: "The event associated with this pass no longer exists" });
      res.json({
        success: true, qrCode: pass.qrCode,
        passDetails: {
          passId: pass.passId, eventTitle: pass.eventId.title,
          eventDate: pass.eventId.date, eventTime: pass.eventId.time,
          venue: pass.eventId.venue, isUsed: pass.isUsed
        }
      });
    } catch (error) {
      console.error("Get student event pass QR error:", error.message);
      res.status(500).json({ success: false, message: "Failed to fetch pass QR code" });
    }
  },

  validateStudentEventPass: async (req, res) => {
    try {
      const { passId } = req.body;
      const studentId = req.user.id;
      const pass = await EventPass.findOne({ passId, studentId })
        .populate('eventId', 'title date time venue organizer')
        .populate('scannedBy', 'name');
      if (!pass) return res.json({ valid: false, message: "Pass not found or you don't have access" });
      res.json({
        valid: true, message: "Pass is valid",
        data: {
          passId: pass.passId, isUsed: pass.isUsed, usedAt: pass.usedAt,
          scannedBy: pass.scannedBy?.name,
          event: pass.eventId ? {
            title: pass.eventId.title, date: pass.eventId.date, time: pass.eventId.time,
            venue: pass.eventId.venue, organizer: pass.eventId.organizer
          } : null
        }
      });
    } catch (error) {
      console.error("Validate student event pass error:", error.message);
      res.status(500).json({ valid: false, message: "Validation error" });
    }
  }
};

module.exports = studentEventController;