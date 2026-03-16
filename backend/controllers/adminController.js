const User = require("../models/User");
const Student = require("../models/Student");
const mongoose = require("mongoose");

const getStats = async (req, res) => {
  try {
    const [totalUsers, students, teachers, librarians, pendingRequests, rejectedRequests] =
      await Promise.all([
        User.countDocuments({ role: { $ne: "admin" } }),
        User.countDocuments({ role: "student" }),
        User.countDocuments({ role: "teacher", status: "approved" }),
        User.countDocuments({ role: "librarian", status: "approved" }),
        User.countDocuments({ status: "pending" }),
        User.countDocuments({ status: "rejected" }),
      ]);
    res.json({ totalUsers, students, teachers, librarians, pendingRequests, rejectedRequests });
  } catch (error) {
    console.error("Admin stats error:", error.message);
    res.status(500).json({ message: "Server error fetching stats" });
  }
};

const getUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;
    const filter = { role: { $ne: "admin" } };
    if (role && ["student", "teacher", "librarian"].includes(role)) filter.role = role;
    if (status && ["pending", "approved", "rejected"].includes(status)) filter.status = status;
    if (search && typeof search === "string") {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ];
    }
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;
    const [users, total] = await Promise.all([
      User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      User.countDocuments(filter),
    ]);
    res.json({ users, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error("Admin getUsers error:", error.message);
    res.status(500).json({ message: "Server error fetching users" });
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const users = await User.find({ status: "pending" }).select("-password").sort({ createdAt: -1 }).lean();
    res.json({ users, total: users.length });
  } catch (error) {
    console.error("Admin pending error:", error.message);
    res.status(500).json({ message: "Server error fetching pending requests" });
  }
};

const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") return res.status(403).json({ message: "Cannot modify admin accounts" });
    if (user.status === "approved") return res.status(400).json({ message: "User is already approved" });
    user.status = "approved";
    await user.save();
    res.json({
      message: `${user.name}'s account has been approved. They can now login with their email: ${user.email}`,
      user,
    });
  } catch (error) {
    console.error("Admin approve error:", error.message);
    res.status(500).json({ message: "Server error approving user" });
  }
};

const rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") return res.status(403).json({ message: "Cannot modify admin accounts" });
    if (user.status === "rejected") return res.status(400).json({ message: "User is already rejected" });
    user.status = "rejected";
    await user.save();
    res.json({ message: `${user.name}'s account has been rejected.`, user });
  } catch (error) {
    console.error("Admin reject error:", error.message);
    res.status(500).json({ message: "Server error rejecting user" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") return res.status(403).json({ message: "Cannot delete admin accounts" });
    if (user.role === "student") await Student.deleteOne({ user: user._id });
    await User.deleteOne({ _id: user._id });
    res.json({ message: `User ${user.name} has been deleted successfully.` });
  } catch (error) {
    console.error("Admin delete error:", error.message);
    res.status(500).json({ message: "Server error deleting user" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin || admin.role !== "admin") return res.status(403).json({ message: "Not authorized" });
    const { name, currentPassword, newPassword } = req.body;
    if (name && name.trim()) admin.name = name.trim();
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: "Current password is required to set a new password" });
      const isMatch = await admin.matchPassword(currentPassword);
      if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });
      if (newPassword.length < 8) return res.status(400).json({ message: "New password must be at least 8 characters" });
      admin.password = newPassword;
    }
    await admin.save();
    res.json({
      message: "Profile updated successfully",
      user: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (error) {
    console.error("Admin updateProfile error:", error.message);
    res.status(500).json({ message: "Server error updating profile" });
  }
};

const transferAdmin = async (req, res) => {
  try {
    const { targetEmail, currentPassword } = req.body;
    if (!targetEmail || !currentPassword) return res.status(400).json({ message: "Target email and current password are required" });
    const currentAdmin = await User.findById(req.user.id);
    if (!currentAdmin || currentAdmin.role !== "admin") return res.status(403).json({ message: "Not authorized" });
    const isMatch = await currentAdmin.matchPassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });
    const targetUser = await User.findOne({ email: targetEmail.toLowerCase() });
    if (!targetUser) return res.status(404).json({ message: `No user found with email: ${targetEmail}` });
    if (targetUser._id.toString() === currentAdmin._id.toString()) return res.status(400).json({ message: "Cannot transfer admin to yourself" });
    if (targetUser.role === "admin") return res.status(400).json({ message: "Target user is already an admin" });
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const oldRole = targetUser.role;
        targetUser.role = "admin";
        targetUser.status = "approved";
        await targetUser.save({ session });
        currentAdmin.role = "teacher";
        currentAdmin.status = "approved";
        await currentAdmin.save({ session });
      });
    } finally {
      session.endSession();
    }
    res.json({
      message: `Admin role transferred to ${targetUser.name} (${targetUser.email}). You have been changed to teacher role. You will be logged out.`,
      newAdmin: { name: targetUser.name, email: targetUser.email },
    });
  } catch (error) {
    console.error("Admin transfer error:", error.message);
    res.status(500).json({ message: "Server error transferring admin role" });
  }
};

module.exports = {
  getStats,
  getUsers,
  getPendingRequests,
  approveUser,
  rejectUser,
  deleteUser,
  updateProfile,
  transferAdmin,
};