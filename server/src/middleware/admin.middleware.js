import User from "../models/User.js";

export default async function requireAdmin(req, res, next) {
  // First check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Fetch user from database to check role
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }

    // Attach full user data to request for later use
    req.userData = user;
    next();
  } catch (err) {
    console.error("Admin middleware error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}