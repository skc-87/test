const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !req.user.role) return res.status(403).json({ message: "Access denied. No role found." });
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Access denied. Insufficient permissions." });
  next();
};
module.exports = { requireRole };
