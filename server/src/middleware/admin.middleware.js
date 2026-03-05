const User = require("../models/User");

module.exports = async function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }

    req.userData = user;
    next();
  } catch (err) {
    console.error("Admin middleware error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};