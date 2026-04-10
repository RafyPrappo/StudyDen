const express = require("express");
const requireAuth = require("../middleware/auth.middleware");
const {
  createSpot,
  getSpots,
  getSpot,
  getMySpots,
  deleteSpot,
  createSpotCheckIn,
  getSpotCheckInStatus,
  createOrUpdateSpotReview,
  getSpotReviews,
  getMySpotReview,
  getSpotsByMyPreferences,

} = require("../controllers/spot.controller");

const router = express.Router();

router.get("/", getSpots);
router.get("/my-spots", requireAuth, getMySpots);
router.get("/:id/check-in-status", requireAuth, getSpotCheckInStatus);
router.post("/:id/check-in", requireAuth, createSpotCheckIn);
router.get("/my-preferences", requireAuth, getSpotsByMyPreferences);
router.get("/:id", getSpot);
router.post("/", requireAuth, createSpot);
router.delete("/:id", requireAuth, deleteSpot);
router.get("/:id/reviews", getSpotReviews);
router.get("/:id/my-review", requireAuth, getMySpotReview);
router.post("/:id/reviews", requireAuth, createOrUpdateSpotReview);

module.exports = router;