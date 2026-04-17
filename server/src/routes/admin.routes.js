const express = require("express");
const requireAuth = require("../middleware/auth.middleware");
const requireAdmin = require("../middleware/admin.middleware");
const User = require("../models/User");
const {
  getNearbyPlaces,
  importPlace,
  getPendingSpots,
  updateSpotStatus,
} = require("../controllers/admin.controller");

const router = express.Router();

const {getSpotReports,resolveReport,} = require("../controllers/admin.controller");

router.get("/reports", requireAuth, requireAdmin, getSpotReports);
router.post("/reports/:id", requireAuth, requireAdmin, resolveReport);

router.get("/places/nearby", requireAuth, requireAdmin, getNearbyPlaces);
router.post("/places/import", requireAuth, requireAdmin, importPlace);


router.get("/spots/pending", requireAuth, requireAdmin, getPendingSpots);
router.put("/spots/:spotId/status", requireAuth, requireAdmin, updateSpotStatus);

router.get("/dashboard", requireAuth, requireAdmin, (req, res) => {
  res.json({
    message: "Welcome to admin dashboard",
    admin: {
      name: req.userData.name,
      email: req.userData.email,
    },
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