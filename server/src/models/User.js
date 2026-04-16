const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    profilePhoto: { type: String, default: "" },
    role: { 
      type: String, 
      enum: ["user", "admin"], 
      default: "user" 
    },
    points: { type: Number, default: 0 },
    badges: [{ type: String }],
    noShowCount: { type: Number, default: 0 },
    lastPenalty: { type: Date },
    eventsDitched: { type: Number, default: 0 },
    dedicatedCount: { type: Number, default: 0 },
    joinedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    completedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],

    preferences: {
      amenities: [{ type: String }],
      crowdLevel: { type: Number, min: 1, max: 5, default: null },
      noiseLevel: { type: Number, min: 1, max: 5, default: null },
      minRating: { type: Number, min: 1, max: 5, default: null },
    },
    
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);