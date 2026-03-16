const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const eventController = require("../controllers/eventController");
const router = express.Router();

// All event routes require authentication
router.use(authMiddleware);

// Event management (teacher only)
router.post("/create", requireRole("teacher"), eventController.createEvent);
router.post("/:eventId/generate-passes", requireRole("teacher"), eventController.generatePasses);
router.post("/validate-qr", requireRole("teacher"), eventController.validateQR);
router.get("/", requireRole("teacher"), eventController.getAllEvents);
router.get("/:eventId/passes", requireRole("teacher"), eventController.getEventPasses);
router.get("/students/list", requireRole("teacher"), eventController.getAllStudents);

module.exports = router;