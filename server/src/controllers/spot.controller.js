const SpotCheckIn = require("../models/SpotCheckIn");
const CROWD_LABELS = {
  1: "Very Low",
  2: "Low",
  3: "Moderate",
  4: "Busy",
  5: "Packed",
};

const NOISE_LABELS = {
  1: "Silent",
  2: "Quiet",
  3: "Moderate",
  4: "Noisy",
  5: "Very Noisy",
};

const Spot = require("../models/Spot");

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

exports.createSpot = async (req, res, next) => {
  try {
    const { title, type, description, address, amenities } = req.body;

    if (!title || !type || !address) {
      return res.status(400).json({
        message: "Title, type, and address are required",
      });
    }

    if (!["Public", "Private"].includes(type)) {
      return res.status(400).json({
        message: "Type must be Public or Private",
      });
    }

    let normalizedAmenities = [];
    if (Array.isArray(amenities)) {
      normalizedAmenities = amenities.filter((item) =>
        ALLOWED_AMENITIES.includes(item)
      );
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSpots = await Spot.countDocuments({
      postedBy: req.user.id,
      createdAt: { $gte: oneHourAgo },
    });

    if (recentSpots >= 5) {
      return res.status(429).json({
        message: "You're posting too many spots. Please wait before posting more.",
      });
    }

    const spot = await Spot.create({
      title,
      type,
      description,
      address,
      amenities: normalizedAmenities,
      postedBy: req.user.id,
    });

    await spot.populate("postedBy", "name email points badges profilePhoto");

    res.status(201).json({ spot });
  } catch (err) {
    next(err);
  }
};

exports.getSpots = async (req, res, next) => {
  try {
    const { type, search, amenity, page = 1, limit = 9 } = req.query;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = { isApproved: true };

    if (type && type !== "All") {
      filter.type = type;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (amenity && amenity !== "All") {
      filter.amenities = amenity;
    }

    const spots = await Spot.find(filter)
      .populate("postedBy", "name email points badges profilePhoto")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit);

    const total = await Spot.countDocuments(filter);

    res.json({
      spots,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getSpot = async (req, res, next) => {
  try {
    const { id } = req.params;

    const spot = await Spot.findById(id).populate(
      "postedBy",
      "name email points badges profilePhoto"
    );

    if (!spot) {
      return res.status(404).json({ message: "Spot not found" });
    }

    res.json({ spot });
  } catch (err) {
    next(err);
  }
};

exports.getMySpots = async (req, res, next) => {
  try {
    const spots = await Spot.find({ postedBy: req.user.id })
      .populate("postedBy", "name email points badges profilePhoto")
      .sort({ createdAt: -1 });

    res.json({ spots });
  } catch (err) {
    next(err);
  }
};

exports.deleteSpot = async (req, res, next) => {
  try {
    const { id } = req.params;

    const spot = await Spot.findById(id);

    if (!spot) {
      return res.status(404).json({ message: "Spot not found" });
    }

    if (spot.postedBy.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    await Spot.findByIdAndDelete(id);

    res.json({ message: "Spot deleted successfully" });
  } catch (err) {
    next(err);
  }
};

exports.createSpotCheckIn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { crowdLevel, noiseLevel } = req.body;

    const parsedCrowdLevel = parseInt(crowdLevel, 10);
    const parsedNoiseLevel = parseInt(noiseLevel, 10);

    if (
      ![1, 2, 3, 4, 5].includes(parsedCrowdLevel) ||
      ![1, 2, 3, 4, 5].includes(parsedNoiseLevel)
    ) {
      return res.status(400).json({
        message: "Crowd level and noise level must be between 1 and 5",
      });
    }

    const spot = await Spot.findById(id);
    if (!spot) {
      return res.status(404).json({ message: "Spot not found" });
    }

    // Simple anti-spam: prevent repeated check-ins to the same spot within 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentCheckIn = await SpotCheckIn.findOne({
      spot: id,
      user: req.user.id,
      checkedInAt: { $gte: tenMinutesAgo },
    }).sort({ checkedInAt: -1 });

    if (recentCheckIn) {
      return res.status(429).json({
        message: "You already checked in recently. Please wait a bit before checking in again.",
      });
    }

    const checkIn = await SpotCheckIn.create({
      spot: id,
      user: req.user.id,
      crowdLevel: parsedCrowdLevel,
      noiseLevel: parsedNoiseLevel,
    });

    await checkIn.populate("user", "name email points badges profilePhoto");

    res.status(201).json({
      checkIn: {
        ...checkIn.toObject(),
        crowdLabel: CROWD_LABELS[checkIn.crowdLevel],
        noiseLabel: NOISE_LABELS[checkIn.noiseLevel],
      },
      message: "Checked in successfully",
    });
  } catch (err) {
    next(err);
  }
};

exports.getSpotCheckInStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const spot = await Spot.findById(id);
    if (!spot) {
      return res.status(404).json({ message: "Spot not found" });
    }

    const latestCheckIn = await SpotCheckIn.findOne({ spot: id })
      .populate("user", "name email points badges profilePhoto")
      .sort({ checkedInAt: -1 });

    const myLatestCheckIn = await SpotCheckIn.findOne({
      spot: id,
      user: req.user.id,
    })
      .populate("user", "name email points badges profilePhoto")
      .sort({ checkedInAt: -1 });

    res.json({
      latestCheckIn: latestCheckIn
        ? {
            ...latestCheckIn.toObject(),
            crowdLabel: CROWD_LABELS[latestCheckIn.crowdLevel],
            noiseLabel: NOISE_LABELS[latestCheckIn.noiseLevel],
          }
        : null,
      myLatestCheckIn: myLatestCheckIn
        ? {
            ...myLatestCheckIn.toObject(),
            crowdLabel: CROWD_LABELS[myLatestCheckIn.crowdLevel],
            noiseLabel: NOISE_LABELS[myLatestCheckIn.noiseLevel],
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
};