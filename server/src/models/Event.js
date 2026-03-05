const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true, 
      trim: true, 
      maxlength: 100 
    },
    topic: { 
      type: String, 
      required: true,
      enum: ["Design", "Development", "Academic", "Nature", "Other"]
    },
    description: { 
      type: String, 
      trim: true, 
      maxlength: 500 
    },
    date: { 
      type: Date, 
      required: true 
    },
    time: { 
      type: String, 
      required: true 
    },
    location: { 
      type: String, 
      required: true 
    },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    radius: { type: Number, default: 100 },
    placeId: { type: String },
    formattedAddress: { type: String },
    maxAttendees: { 
      type: Number, 
      required: true, 
      min: 2, 
      max: 100 
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    attendees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    attendeesPresent: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    attendeesCompleted: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    favorites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming"
    },
    startedAt: { type: Date },
    endedAt: { type: Date },
    hostPresent: { type: Boolean, default: false },
    hostLastSeen: { type: Date },
    hostCompleted: { type: Boolean, default: false },
    attendeeTimers: {
      type: Map,
      of: new mongoose.Schema({
        joinedAt: Date,
        lastSeenAt: Date,
        hostWasPresent: Boolean,
        present: Boolean,
        completed: { type: Boolean, default: false },
        completedAt: Date,
        totalMinutes: { type: Number, default: 0 }
      }, { _id: false }),
      default: {}
    },
    endorsement: {
      type: Number,
      default: 0
    },
    isSuccessful: {
      type: Boolean,
      default: false
    },
    shareCount: {
      type: Number,
      default: 0
    },
    cancelledAt: { type: Date },
    pointsAwarded: { type: Boolean, default: false },
    hostPointsAwarded: { type: Boolean, default: false }
  },
  { timestamps: true }
);

eventSchema.virtual("spotsFilled").get(function() {
  return this.attendees.length;
});

eventSchema.virtual("spotsRemaining").get(function() {
  return this.maxAttendees - this.attendees.length;
});

eventSchema.virtual("isFull").get(function() {
  return this.attendees.length >= this.maxAttendees;
});

eventSchema.virtual("spotsText").get(function() {
  return `${this.attendees.length}/${this.maxAttendees} spots filled`;
});

eventSchema.methods.isUserAttending = function(userId) {
  return this.attendees.some(id => id.toString() === userId.toString());
};

eventSchema.methods.isUserPresent = function(userId) {
  return this.attendeesPresent.some(id => id.toString() === userId.toString());
};

eventSchema.methods.isUserCompleted = function(userId) {
  return this.attendeesCompleted.some(id => id.toString() === userId.toString());
};

eventSchema.methods.isUserFavorited = function(userId) {
  return this.favorites.some(id => id.toString() === userId.toString());
};

eventSchema.methods.getTimerForUser = function(userId) {
  return this.attendeeTimers.get(userId.toString()) || {
    joinedAt: null,
    lastSeenAt: null,
    hostWasPresent: false,
    present: false,
    completed: false,
    completedAt: null,
    totalMinutes: 0
  };
};

module.exports = mongoose.model("Event", eventSchema);