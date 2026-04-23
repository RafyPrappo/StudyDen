const Spot = require("../models/Spot");
const Event = require("../models/Event");
const User = require("../models/User");
const SpotCheckIn = require("../models/SpotCheckIn");
const SpotReview = require("../models/SpotReview");

exports.getHomeStats = async (req, res, next) => {
  try {
    const [totalSpots, upcomingEvents, totalUsers] = await Promise.all([
      Spot.countDocuments({ isApproved: true }),
      Event.countDocuments({ status: "upcoming" }),
      User.countDocuments({ role: "user" })
    ]);

    res.json({ totalSpots, upcomingEvents, totalUsers });
  } catch (err) {
    next(err);
  }
};

exports.getFeaturedSpots = async (req, res, next) => {
  try {
    const spots = await Spot.aggregate([
      { $match: { isApproved: true } },
      {
        $lookup: {
          from: "spotreviews",
          localField: "_id",
          foreignField: "spot",
          as: "reviews"
        }
      },
      {
        $addFields: {
          averageRating: { $avg: "$reviews.rating" },
          totalReviews: { $size: "$reviews" }
        }
      },
      { $sort: { averageRating: -1 } },
      { $limit: 4 },
      {
        $project: {
          title: 1,
          address: 1,
          averageRating: 1,
          totalReviews: 1,
          verificationStatus: 1
        }
      }
    ]);

    const formatted = spots.map(s => ({
      ...s,
      averageRating: Number(s.averageRating?.toFixed(1) || 0)
    }));

    res.json({ spots: formatted });
  } catch (err) {
    next(err);
  }
};

exports.getTrendingEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ status: "upcoming" })
      .populate("host", "name profilePhoto")
      .sort({ attendeesCount: -1, date: 1 })
      .limit(6)
      .lean();

    const formatted = events.map(e => ({
      _id: e._id,
      title: e.title,
      date: e.date,
      time: e.time,
      location: e.location,
      attendeesCount: e.attendees.length,
      maxAttendees: e.maxAttendees,
      host: e.host
    }));

    res.json({ events: formatted });
  } catch (err) {
    next(err);
  }
};

exports.getCommunityStats = async (req, res, next) => {
  try {
    const [totalCheckIns, totalReviews] = await Promise.all([
      SpotCheckIn.countDocuments(),
      SpotReview.countDocuments()
    ]);

    res.json({ totalCheckIns, totalReviews });
  } catch (err) {
    next(err);
  }
};