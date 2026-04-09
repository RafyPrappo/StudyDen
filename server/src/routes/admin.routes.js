const express = require("express");
const requireAuth = require("../middleware/auth.middleware");
const requireAdmin = require("../middleware/admin.middleware");
const User = require("../models/User");

const router = express.Router();
const {getNearbyPlaces, importPlace,} = require("../controllers/admin.controller");

router.get("/places/nearby", requireAuth, requireAdmin, getNearbyPlaces);
router.post("/places/import", requireAuth, requireAdmin, importPlace);
router.get("/dashboard", requireAuth, requireAdmin, (req, res) => {
  res.json({ 
    message: "Welcome to admin dashboard",
    admin: {
      name: req.userData.name,
      email: req.userData.email
    }
  });
});

router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;