const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");
const path = require("path");
const modelRoute = require("./routes/modelRoutes");
const eventRoutes = require("./routes/eventRoutes");
const studentEventRoutes = require("./routes/studentEventRoutes");
const libraryRoutes = require('./routes/libraryRoutes');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();

if (!process.env.JWT_SECRET) { console.error("FATAL: JWT_SECRET is not set in environment. Exiting."); process.exit(1); }
if (!process.env.MONGO_URI) { console.error("FATAL: MONGO_URI is not set in environment. Exiting."); process.exit(1); }

connectDB();

const app = express();
app.set('trust proxy', 1); // Required for Render — fixes express-rate-limit X-Forwarded-For error

app.use(helmet({
  crossOriginResourcePolicy: false,
}));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});
app.use(generalLimiter);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim().replace(/\/$/, ''))
  : ["http://localhost:5173", "http://localhost:5174"];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/model", modelRoute);
app.use("/api/events", eventRoutes);
app.use("/api/student/events", studentEventRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error(process.env.NODE_ENV === 'production' ? err.message : err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// ── Keep-alive ping ───────────────────────────────────────────────────────────
// Pings the Render model service every 10 minutes so it doesn't spin down
// on the free tier. Only runs when the server is actually listening (not Vercel).
if (!process.env.VERCEL && process.env.HANDWRITING_SERVICE_URL) {
  setInterval(async () => {
    try {
      const res = await fetch(`${process.env.HANDWRITING_SERVICE_URL}/health`);
      const data = await res.json();
      console.log(`[Ping] Handwriting service alive: ${data.status}`);
    } catch (e) {
      console.warn(`[Ping] Handwriting service unreachable: ${e.message}`);
    }
  }, 10 * 60 * 1000); // every 10 minutes

  console.log(`[Ping] Keep-alive started for: ${process.env.HANDWRITING_SERVICE_URL}`);
}
// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}