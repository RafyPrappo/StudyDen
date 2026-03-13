const mongoose = require("mongoose");

const spotCheckInSchema = new mongoose.Schema(
  {
    spot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Spot",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    crowdLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    noiseLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    checkedInAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

spotCheckInSchema.index({ spot: 1, checkedInAt: -1 });
spotCheckInSchema.index({ user: 1, spot: 1, checkedInAt: -1 });

module.exports = mongoose.model("SpotCheckIn", spotCheckInSchema);