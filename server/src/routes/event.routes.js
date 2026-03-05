const express = require("express");
const requireAuth = require("../middleware/auth.middleware");
const {
  createEvent,
  getEvents,
  getEvent,
  joinEvent,
  leaveEvent,
  toggleFavorite,
  shareEvent,
  deleteEvent,
  trackLocation,
  getEventStatus,
  completeEvent,
  markAttendance,
  submitEndorsement,
  getMyEvents,
  getHostedEvents
} = require("../controllers/event.controller");

const router = express.Router();

router.get("/", getEvents);
router.get("/:id", getEvent);

router.post("/", requireAuth, createEvent);
router.post("/:id/join", requireAuth, joinEvent);
router.post("/:id/leave", requireAuth, leaveEvent);
router.post("/:id/favorite", requireAuth, toggleFavorite);
router.post("/:id/share", requireAuth, shareEvent);
router.delete("/:id", requireAuth, deleteEvent);
router.post("/:id/track", requireAuth, trackLocation);
router.get("/:id/status", requireAuth, getEventStatus);
router.post("/:id/complete", requireAuth, completeEvent);
router.post("/:id/attendance", requireAuth, markAttendance);
router.post("/:id/endorse", requireAuth, submitEndorsement);
router.get("/user/joined", requireAuth, getMyEvents);
router.get("/user/hosted", requireAuth, getHostedEvents);

module.exports = router;