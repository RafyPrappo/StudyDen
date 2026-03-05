import express from "express";
import requireAuth from "../middleware/auth.middleware.js";
import requireAdmin from "../middleware/admin.middleware.js";

const router = express.Router();

// All admin routes require both auth and admin middleware
router.get("/dashboard", requireAuth, requireAdmin, (req, res) => {
  res.json({ 
    message: "Welcome to admin dashboard",
    admin: {
      name: req.userData.name,
      email: req.userData.email
    }
  });
});

// Example: Get all users (admin only)
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const User = await import("../models/User.js").then(m => m.default);
    const users = await User.find().select("-passwordHash");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;