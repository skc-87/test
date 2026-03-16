const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ message: "Invalid token format" });
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id role status");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.status && user.status !== "approved") return res.status(403).json({ message: `Account ${user.status}. Please contact an administrator.` });
    req.user = { id: user._id.toString(), role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
module.exports = { authMiddleware };
