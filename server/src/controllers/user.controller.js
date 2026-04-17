const User = require("../models/User");
const Event = require("../models/Event");
const Notification = require("../models/Notification");
const fs = require("fs");
const path = require("path");
const Spot = require("../models/Spot");
const SpotCheckIn = require("../models/SpotCheckIn");
const mongoose = require("mongoose");

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    const user = await User.findById(userId)
      .select("-passwordHash")
      .populate("joinedEvents", "title date time status")
      .populate("completedEvents", "title date time status host")
      .populate({
        path: "completedEvents",
        populate: {
          path: "host",
          select: "name profilePhoto"
        }
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const ditchStreak = user.noShowCount || 0;
    const completedCount = user.completedEvents?.length || 0;

    res.json({
      user,
      stats: {
        ditchStreak,
        completedCount,
        totalPoints: user.points,
        badges: user.badges || []
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    const updates = {};

    if (name) updates.name = name;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select("-passwordHash");

    res.json({ user });
  } catch (err) {
    next(err);
  }
};

exports.uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    
    // Delete old photo if exists
    const oldUser = await User.findById(req.user.id);
    if (oldUser.profilePhoto) {
      const oldFilename = oldUser.profilePhoto.split('/').pop();
      const oldFilepath = path.join(__dirname, '../../uploads', oldFilename);
      try {
        if (fs.existsSync(oldFilepath)) {
          fs.unlinkSync(oldFilepath);
          console.log("Deleted old photo:", oldFilepath);
        }
      } catch (err) {
        console.error("Error deleting old photo:", err);
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePhoto: photoUrl },
      { new: true }
    ).select("-passwordHash");

    res.json({ 
      message: "Profile photo uploaded successfully",
      profilePhoto: photoUrl,
      user 
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Failed to upload photo" });
  }
};

exports.removeProfilePhoto = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.profilePhoto) {
      const filename = user.profilePhoto.replace('/uploads/', '');
      const filepath = path.join(__dirname, '../../uploads', filename);
      
      try {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
          console.log("Successfully deleted file:", filepath);
        }
      } catch (err) {
        console.error("Error deleting file:", err);
      }
    }

    user.profilePhoto = "";
    await user.save();

    const updatedUser = await User.findById(req.user.id).select("-passwordHash");

    res.json({ 
      message: "Profile photo removed successfully",
      user: updatedUser
    });
  } catch (err) {
    console.error("Remove photo error:", err);
    res.status(500).json({ message: "Failed to remove photo" });
  }
};

// ... keep the rest of your existing functions (getNotifications, etc.) exactly as they were ...
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ user: req.user.id })
      .populate("event", "title date time")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ 
      user: req.user.id, 
      read: false 
    });

    const total = await Notification.countDocuments({ user: req.user.id });

    res.json({
      notifications,
      unreadCount,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ notification });
  } catch (err) {
    next(err);
  }
};

exports.markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted" });
  } catch (err) {
    next(err);
  }
};

exports.getDitchStreak = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("noShowCount eventsDitched");
    
    res.json({
      currentStreak: user.noShowCount || 0,
      totalDitched: user.eventsDitched || 0
    });
  } catch (err) {
    next(err);
  }
};

exports.getCompletedEvents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user.id)
      .populate({
        path: "completedEvents",
        options: {
          sort: { date: -1 },
          skip,
          limit: parseInt(limit)
        },
        populate: {
          path: "host",
          select: "name profilePhoto"
        }
      });

    const total = user.completedEvents?.length || 0;

    res.json({
      events: user.completedEvents || [],
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("preferences");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      preferences: {
        amenities: user.preferences?.amenities || [],
        crowdLevel: user.preferences?.crowdLevel || null,
        noiseLevel: user.preferences?.noiseLevel || null,
        minRating: user.preferences?.minRating || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.updateMyPreferences = async (req, res, next) => {
  try {
    const {
      amenities = [],
      crowdLevel = null,
      noiseLevel = null,
      minRating = null,
    } = req.body;

    const ALLOWED_AMENITIES = [
      "WiFi",
      "Charging Points",
      "AC",
      "Quiet Zone",
      "Snacks",
      "Parking",
      "Washroom",
      "Group Seating",
      "Smoking Zone",
    ];

    const normalizedAmenities = Array.isArray(amenities)
      ? amenities.filter((item) => ALLOWED_AMENITIES.includes(item))
      : [];

    const parsedCrowdLevel =
      crowdLevel === null || crowdLevel === "" ? null : parseInt(crowdLevel, 10);

    const parsedNoiseLevel =
      noiseLevel === null || noiseLevel === "" ? null : parseInt(noiseLevel, 10);

    const parsedMinRating =
      minRating === null || minRating === "" ? null : parseInt(minRating, 10);

    if (
      parsedCrowdLevel !== null &&
      ![1, 2, 3, 4, 5].includes(parsedCrowdLevel)
    ) {
      return res.status(400).json({ message: "Crowd level must be between 1 and 5" });
    }

    if (
      parsedNoiseLevel !== null &&
      ![1, 2, 3, 4, 5].includes(parsedNoiseLevel)
    ) {
      return res.status(400).json({ message: "Noise level must be between 1 and 5" });
    }

    if (
      parsedMinRating !== null &&
      ![1, 2, 3, 4, 5].includes(parsedMinRating)
    ) {
      return res.status(400).json({ message: "Minimum rating must be between 1 and 5" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        preferences: {
          amenities: normalizedAmenities,
          crowdLevel: parsedCrowdLevel,
          noiseLevel: parsedNoiseLevel,
          minRating: parsedMinRating,
        },
      },
      { new: true, runValidators: true }
    ).select("preferences");

    res.json({
      message: "Preferences saved successfully",
      preferences: user.preferences,
    });
  } catch (err) {
    next(err);
  }
};

exports.toggleFavouriteSpot = async (req, res, next) => {
  try {
    const { spotId } = req.params;

    const spot = await Spot.findById(spotId);
    if (!spot) {
      return res.status(404).json({ message: "Spot not found" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingIndex = user.favouriteSpots.findIndex(
      (id) => id.toString() === spotId
    );

    let isFavourite = false;

    if (existingIndex > -1) {
      user.favouriteSpots.splice(existingIndex, 1);
      isFavourite = false;
    } else {
      user.favouriteSpots.push(spotId);
      isFavourite = true;
    }

    await user.save();

    res.json({
      message: isFavourite
        ? "Spot added to favourites"
        : "Spot removed from favourites",
      isFavourite,
      favourites: user.favouriteSpots,
    });
  } catch (err) {
    next(err);
  }
};

exports.getFavouriteSpots = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "favouriteSpots",
      populate: {
        path: "postedBy",
        select: "name email points badges profilePhoto",
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      spots: user.favouriteSpots || [],
    });
  } catch (err) {
    next(err);
  }
};

exports.getVisitedSpots = async (req, res, next) => {
  try {
    const visits = await SpotCheckIn.find({ user: req.user.id })
      .populate({
        path: "spot",
        populate: {
          path: "postedBy",
          select: "name email points badges profilePhoto",
        },
      })
      .sort({ checkedInAt: -1 });

    const uniqueSpots = [];
    const seenSpotIds = new Set();

    for (const visit of visits) {
      const spotId = visit.spot?._id?.toString();

      if (spotId && !seenSpotIds.has(spotId)) {
        seenSpotIds.add(spotId);
        uniqueSpots.push(visit.spot);
      }
    }

    res.json({
      spots: uniqueSpots,
    });
  } catch (err) {
    next(err);
  }
};

exports.getFrequentSpots = async (req, res, next) => {
  try {
    const frequentData = await SpotCheckIn.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
        },
      },
      {
        $group: {
          _id: "$spot",
          visitCount: { $sum: 1 },
          lastVisitedAt: { $max: "$checkedInAt" },
        },
      },
      {
        $sort: {
          visitCount: -1,
          lastVisitedAt: -1,
        },
      },
      {
        $limit: 10,
      },
    ]);

    const spotIds = frequentData.map((item) => item._id);

    const spots = await Spot.find({ _id: { $in: spotIds } })
      .populate("postedBy", "name email points badges profilePhoto")
      .lean();

    const countMap = new Map(
      frequentData.map((item) => [
        item._id.toString(),
        {
          visitCount: item.visitCount,
          lastVisitedAt: item.lastVisitedAt,
        },
      ])
    );

    const enrichedSpots = spotIds
      .map((spotId) => {
        const spot = spots.find((s) => s._id.toString() === spotId.toString());
        if (!spot) return null;

        const stats = countMap.get(spotId.toString());

        return {
          ...spot,
          visitCount: stats?.visitCount || 0,
          lastVisitedAt: stats?.lastVisitedAt || null,
        };
      })
      .filter(Boolean);

    res.json({
      spots: enrichedSpots,
    });
  } catch (err) {
    next(err);
  }
};