const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const { getStats, getUsers, getPendingRequests, approveUser, rejectUser, deleteUser, updateProfile, transferAdmin } = require("../controllers/adminController");
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") return res.status(403).json({ message: "Access denied. Admin privileges required." });
  next();
};
router.use(authMiddleware, adminOnly);
router.get("/stats", getStats);
router.get("/users", getUsers);
router.get("/pending", getPendingRequests);
router.put("/users/:id/approve", approveUser);
router.put("/users/:id/reject", rejectUser);
router.delete("/users/:id", deleteUser);
router.put("/profile", updateProfile);
router.put("/transfer", transferAdmin);
module.exports = router;
