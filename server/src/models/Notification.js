const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: ["event_cancelled", "event_reminder", "badge_earned", "points_earned", "event_starting"],
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);