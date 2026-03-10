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

const spotSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    type: {
      type: String,
      required: true,
      enum: ["Public", "Private"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    amenities: [
      {
        type: String,
        enum: ALLOWED_AMENITIES,
      },
    ],
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

spotSchema.index({ title: "text", address: "text", description: "text" });

module.exports = mongoose.model("Spot", spotSchema);