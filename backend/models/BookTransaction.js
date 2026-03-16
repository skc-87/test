const mongoose = require("mongoose");
const bookTransactionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: "LibraryBook", required: true },
  issue_date: { type: Date, required: true },
  due_date: { type: Date, required: true },
  return_date: { type: Date },
  fine_amount: { type: Number, default: 0 },
  status: { type: String, enum: ["issued", "returned", "overdue"], default: "issued" },
  remarks: { type: String }
}, { timestamps: true });
bookTransactionSchema.index({ student: 1, status: 1 });
bookTransactionSchema.index({ due_date: 1 });
bookTransactionSchema.index({ student: 1, book: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'issued' } });
module.exports = mongoose.model("BookTransaction", bookTransactionSchema);