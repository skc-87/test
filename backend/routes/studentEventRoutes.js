const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const studentEventController = require("../controllers/studentEventController");
const router = express.Router();

// All routes require student authentication
router.use(authMiddleware, requireRole("student"));

// Student event management routes
router.get("/passes", studentEventController.getStudentEventPasses);
router.get("/events/:eventId", studentEventController.getStudentEventDetails);
router.get("/events/:eventId/qr-code", studentEventController.getStudentEventPassQR);
router.post("/validate-pass", studentEventController.validateStudentEventPass);

module.exports = router;