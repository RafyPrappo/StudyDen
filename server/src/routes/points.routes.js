const express = require("express");
const requireAuth = require("../middleware/auth.middleware");
const requireAdmin = require("../middleware/admin.middleware");
const {
  awardPoints,
  getUserPoints,
  getMyPoints
} = require("../controllers/points.controller");

const router = express.Router();

router.get("/me", requireAuth, getMyPoints);
router.get("/user/:userId", requireAuth, getUserPoints);
router.post("/award", requireAuth, requireAdmin, awardPoints);

module.exports = router;