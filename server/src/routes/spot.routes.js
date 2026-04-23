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
<<<<<<< HEAD
=======
  getSpotsByMyPreferences,
  getSpotDirections,
  getSpotAnalytics,
  getSpotAISummary,
  reportSpot,
>>>>>>> main
} = require("../controllers/spot.controller");

const router = express.Router();

router.get("/", getSpots);
router.get("/my-spots", requireAuth, getMySpots);
<<<<<<< HEAD
router.get("/:id/check-in-status", requireAuth, getSpotCheckInStatus);
router.post("/:id/check-in", requireAuth, createSpotCheckIn);
=======
router.get("/my-preferences", requireAuth, getSpotsByMyPreferences);

router.get("/:id/check-in-status", requireAuth, getSpotCheckInStatus);
router.post("/:id/check-in", requireAuth, createSpotCheckIn);

router.get("/:id/directions", requireAuth, getSpotDirections);
router.get("/:id/analytics", getSpotAnalytics);
router.get("/:id/ai-summary", getSpotAISummary);

router.get("/:id/reviews", getSpotReviews);
router.get("/:id/my-review", requireAuth, getMySpotReview);
router.post("/:id/reviews", requireAuth, createOrUpdateSpotReview);

>>>>>>> main
router.get("/:id", getSpot);
router.post("/", requireAuth, createSpot);
router.delete("/:id", requireAuth, deleteSpot);
router.get("/:id/reviews", getSpotReviews);
router.get("/:id/my-review", requireAuth, getMySpotReview);
router.post("/:id/reviews", requireAuth, createOrUpdateSpotReview);

router.post("/:id/report", requireAuth, reportSpot);

module.exports = router;