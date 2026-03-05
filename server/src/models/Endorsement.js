const mongoose = require("mongoose");

const endorsementSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },
    attendee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    endorsed: {
      type: Boolean,
      default: false
    },
    present: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

endorsementSchema.index({ event: 1, attendee: 1 }, { unique: true });

module.exports = mongoose.model("Endorsement", endorsementSchema);