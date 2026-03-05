const express = require("express");
const multer = require("multer");
const path = require("path");
const requireAuth = require("../middleware/auth.middleware");
const {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  removeProfilePhoto,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getDitchStreak,
  getCompletedEvents
} = require("../controllers/user.controller");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get("/profile/:userId?", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);
router.post("/profile/photo", requireAuth, upload.single("photo"), uploadProfilePhoto);
router.delete("/profile/photo", requireAuth, removeProfilePhoto);

router.get("/notifications", requireAuth, getNotifications);
router.put("/notifications/:id/read", requireAuth, markNotificationRead);
router.put("/notifications/read-all", requireAuth, markAllNotificationsRead);
router.delete("/notifications/:id", requireAuth, deleteNotification);

router.get("/ditch-streak", requireAuth, getDitchStreak);
router.get("/completed-events", requireAuth, getCompletedEvents);

module.exports = router;