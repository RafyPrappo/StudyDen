const express = require("express");
const requireAuth = require("../middleware/auth.middleware");
const {
  getLeaderboard,
  getUserRank,
  getMyRank
} = require("../controllers/leaderboard.controller");

const router = express.Router();

router.get("/", getLeaderboard);
router.get("/me", requireAuth, getMyRank);
router.get("/user/:userId", requireAuth, getUserRank);

module.exports = router;