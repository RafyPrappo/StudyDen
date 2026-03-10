const express = require("express");
const requireAuth = require("../middleware/auth.middleware");
const {
  createSpot,
  getSpots,
  getSpot,
  getMySpots,
  deleteSpot,
} = require("../controllers/spot.controller");

const router = express.Router();

router.get("/", getSpots);
router.get("/my-spots", requireAuth, getMySpots);
router.get("/:id", getSpot);

router.post("/", requireAuth, createSpot);
router.delete("/:id", requireAuth, deleteSpot);

module.exports = router;