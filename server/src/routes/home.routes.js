const express = require("express");
const {
  getHomeStats,
  getFeaturedSpots,
  getTrendingEvents,
  getCommunityStats
} = require("../controllers/home.controller");

const router = express.Router();

router.get("/stats", getHomeStats);
router.get("/featured", getFeaturedSpots);
router.get("/trending", getTrendingEvents);
router.get("/community", getCommunityStats);

module.exports = router;