const SpotReview = require("../models/SpotReview");
const { PointsCalculator } = require("../utils/pointsCalculator"); // Prappo
const Notification = require("../models/Notification"); // Prappo


exports.createOrUpdateSpotReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, reviewText = "", availableAmenities = [] } = req.body;

    const parsedRating = parseInt(rating, 10);

    if (![1, 2, 3, 4, 5].includes(parsedRating)) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    const spot = await Spot.findById(id);
    if (!spot) {
      return res.status(404).json({ message: "Spot not found" });
    }

    const hasCheckedIn = await SpotCheckIn.exists({
      spot: id,
      user: req.user.id,
    });

    if (!hasCheckedIn) {
      return res.status(403).json({
        message: "You must check in at this spot before leaving a review",
      });
    }

    const normalizedAmenities = Array.isArray(availableAmenities)
      ? availableAmenities.filter((item) => ALLOWED_AMENITIES.includes(item))
      : [];

    const review = await SpotReview.findOneAndUpdate(
      { spot: id, user: req.user.id },
      {
        spot: id,
        user: req.user.id,
        rating: parsedRating,
        reviewText,
        availableAmenities: normalizedAmenities,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).populate("user", "name email points badges profilePhoto");

    res.status(200).json({
      review,
      message: "Review saved successfully",
    });
  } catch (err) {
    next(err);
  }
};

exports.getSpotReviews = async (req, res, next) => {
  try {
    const { id } = req.params;

    const spot = await Spot.findById(id);
    if (!spot) {
      return res.status(404).json({ message: "Spot not found" });
    }

    const reviews = await SpotReview.find({ spot: id })
      .populate("user", "name email points badges profilePhoto")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Number(
            (
              reviews.reduce((sum, item) => sum + item.rating, 0) / totalReviews
            ).toFixed(1)
          )
        : 0;

    res.json({
      reviews,
      summary: {
        averageRating,
        totalReviews,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getMySpotReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await SpotReview.findOne({
      spot: id,
      user: req.user.id,
    }).populate("user", "name email points badges profilePhoto");

    res.json({ review });
  } catch (err) {
    next(err);
  }
};

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
const User = require("../models/User");

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
    const { title, type, description, address, amenities, lat, lng } = req.body;

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

    if (
      lat === undefined ||
      lng === undefined ||
      Number.isNaN(Number(lat)) ||
      Number.isNaN(Number(lng))
    ) {
      return res.status(400).json({
        message: "Valid map coordinates are required",
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
      location: {
        lat: Number(lat),
        lng: Number(lng),
      },
    });

    await spot.populate("postedBy", "name email points badges profilePhoto");

  // Prappo: Award points for creating a spot ->
  const user = await User.findById(req.user.id);
  const pointsEarned = PointsCalculator.getPointsForAction('ADD_SPOT');
  user.points += pointsEarned;

  // New badge chek
  const newBadges = PointsCalculator.checkNewBadges(user);
  if (newBadges.length > 0) {
    user.badges = [...(user.badges || []), ...newBadges];
  }
  await user.save();

  // send notification
  await Notification.create({
    user: user._id,
    type: "points_earned",
    title: "Points Earned",
    message: `You earned ${pointsEarned} points for adding a new spot!`
  });


    res.status(201).json({ spot });
  } catch (err) {
    next(err);
  }


};

exports.getSpots = async (req, res, next) => {
  try {
    const {
      type,
      search,
      amenity,
      minRating,
      page = 1,
      limit = 9,
    } = req.query;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const parsedMinRating =
      minRating && minRating !== "All" ? parseFloat(minRating) : null;

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

    const matchingSpots = await Spot.find(filter)
      .populate("postedBy", "name email points badges profilePhoto")
      .sort({ createdAt: -1 })
      .lean();

    const spotIds = matchingSpots.map((spot) => spot._id);

    const ratingStats = await SpotReview.aggregate([
      {
        $match: {
          spot: { $in: spotIds },
        },
      },
      {
        $group: {
          _id: "$spot",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const ratingMap = new Map(
      ratingStats.map((item) => [
        item._id.toString(),
        {
          averageRating: Number(item.averageRating.toFixed(1)),
          totalReviews: item.totalReviews,
        },
      ])
    );

    let enrichedSpots = matchingSpots.map((spot) => {
      const ratingInfo = ratingMap.get(spot._id.toString()) || {
        averageRating: 0,
        totalReviews: 0,
      };

      return {
        ...spot,
        averageRating: ratingInfo.averageRating,
        totalReviews: ratingInfo.totalReviews,
      };
    });

    if (parsedMinRating !== null && !Number.isNaN(parsedMinRating)) {
      enrichedSpots = enrichedSpots.filter(
        (spot) => spot.averageRating >= parsedMinRating
      );
    }

    const total = enrichedSpots.length;
    const pages = Math.ceil(total / parsedLimit) || 1;
    const skip = (parsedPage - 1) * parsedLimit;

    const paginatedSpots = enrichedSpots.slice(skip, skip + parsedLimit);

    res.json({
      spots: paginatedSpots,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages,
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

  // Prappo: Deduct points for deleting a spot ->
  const originalPoster = await User.findById(spot.postedBy);
  const pointsToDeduct = PointsCalculator.getPointsForAction('REMOVE_SPOT');
  originalPoster.points = Math.max(0, originalPoster.points + pointsToDeduct);
  await originalPoster.save();

  // send notification to original poster
  await Notification.create({
    user: originalPoster._id,
    type: "points_earned",
    title: "Points Deducted",
    message: `You lost ${-pointsToDeduct} points for deleting a spot.`
  });

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

exports.getSpotsByMyPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("preferences");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const preferences = user.preferences || {};
    const preferredAmenities = Array.isArray(preferences.amenities)
      ? preferences.amenities
      : [];
    const preferredCrowdLevel = preferences.crowdLevel ?? null;
    const preferredNoiseLevel = preferences.noiseLevel ?? null;
    const preferredMinRating = preferences.minRating ?? null;

    const { page = 1, limit = 9 } = req.query;
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    const spots = await Spot.find({ isApproved: true })
      .populate("postedBy", "name email points badges profilePhoto")
      .sort({ createdAt: -1 })
      .lean();

    const spotIds = spots.map((spot) => spot._id);

    const ratingStats = await SpotReview.aggregate([
      {
        $match: {
          spot: { $in: spotIds },
        },
      },
      {
        $group: {
          _id: "$spot",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const ratingMap = new Map(
      ratingStats.map((item) => [
        item._id.toString(),
        {
          averageRating: Number(item.averageRating.toFixed(1)),
          totalReviews: item.totalReviews,
        },
      ])
    );

    const latestCheckIns = await SpotCheckIn.aggregate([
      {
        $match: {
          spot: { $in: spotIds },
        },
      },
      {
        $sort: {
          checkedInAt: -1,
        },
      },
      {
        $group: {
          _id: "$spot",
          crowdLevel: { $first: "$crowdLevel" },
          noiseLevel: { $first: "$noiseLevel" },
          checkedInAt: { $first: "$checkedInAt" },
        },
      },
    ]);

    const checkInMap = new Map(
      latestCheckIns.map((item) => [
        item._id.toString(),
        {
          crowdLevel: item.crowdLevel,
          noiseLevel: item.noiseLevel,
          checkedInAt: item.checkedInAt,
        },
      ])
    );

    let enrichedSpots = spots.map((spot) => {
      const ratingInfo = ratingMap.get(spot._id.toString()) || {
        averageRating: 0,
        totalReviews: 0,
      };

      const latestCheckIn = checkInMap.get(spot._id.toString()) || {
        crowdLevel: null,
        noiseLevel: null,
        checkedInAt: null,
      };

      return {
        ...spot,
        averageRating: ratingInfo.averageRating,
        totalReviews: ratingInfo.totalReviews,
        latestCrowdLevel: latestCheckIn.crowdLevel,
        latestNoiseLevel: latestCheckIn.noiseLevel,
        latestCheckInAt: latestCheckIn.checkedInAt,
      };
    });

    if (preferredAmenities.length > 0) {
      enrichedSpots = enrichedSpots.filter((spot) =>
        preferredAmenities.every((amenity) => spot.amenities?.includes(amenity))
      );
    }

    if (preferredCrowdLevel !== null) {
      enrichedSpots = enrichedSpots.filter(
        (spot) => spot.latestCrowdLevel === preferredCrowdLevel
      );
    }

    if (preferredNoiseLevel !== null) {
      enrichedSpots = enrichedSpots.filter(
        (spot) => spot.latestNoiseLevel === preferredNoiseLevel
      );
    }

    if (preferredMinRating !== null) {
      enrichedSpots = enrichedSpots.filter(
        (spot) => spot.averageRating >= preferredMinRating
      );
    }

    const total = enrichedSpots.length;
    const pages = Math.ceil(total / parsedLimit) || 1;
    const skip = (parsedPage - 1) * parsedLimit;
    const paginatedSpots = enrichedSpots.slice(skip, skip + parsedLimit);

    res.json({
      spots: paginatedSpots,
      preferences: {
        amenities: preferredAmenities,
        crowdLevel: preferredCrowdLevel,
        noiseLevel: preferredNoiseLevel,
        minRating: preferredMinRating,
      },
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages,
      },
    });
  } catch (err) {
    next(err);
  }
};