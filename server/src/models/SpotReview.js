const mongoose = require("mongoose");

const ALLOWED_AMENITIES = [
  "WiFi",
  "Charging Points",
  "AC",
  "Quiet Zone",
  "Snacks",
  "Parking",
  "Washroom",
  "Group Seating",
];

const spotReviewSchema = new mongoose.Schema(
  {
    spot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Spot",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    availableAmenities: [
      {
        type: String,
        enum: ALLOWED_AMENITIES,
      },
    ],
  },
  { timestamps: true }
);

spotReviewSchema.index({ spot: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("SpotReview", spotReviewSchema);