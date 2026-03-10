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