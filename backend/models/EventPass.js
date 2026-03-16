const mongoose = require("mongoose");
const eventPassSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  qrCode: { type: String, required: true },
  passId: { type: String, required: true, unique: true },
  isUsed: { type: Boolean, default: false },
  usedAt: { type: Date },
  scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
eventPassSchema.index({ eventId: 1, studentId: 1 }, { unique: true });
const EventPass = mongoose.model("EventPass", eventPassSchema);
module.exports = EventPass;