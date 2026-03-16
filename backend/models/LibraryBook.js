const mongoose = require("mongoose");

const libraryBookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: true },
    author: { type: String, required: true, index: true },
    isbn: { type: String, required: true, unique: true },
    category: { type: String, required: true, index: true },
    publisher: { type: String, required: true },
    publication_year: { type: Number, required: true },
    total_copies: { type: Number, required: true, default: 1 },
    available_copies: { type: Number, required: true, default: 1 },
    location: { type: String },
    description: { type: String },
    image: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LibraryBook", libraryBookSchema);