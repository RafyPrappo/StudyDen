const User = require("../models/User");
const { PointsCalculator, POINTS } = require("../utils/pointsCalculator");

exports.awardPoints = async (req, res, next) => {
  try {
    const { userId, action } = req.body;
    
    if (req.user.id !== userId && req.userData?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const points = PointsCalculator.getPointsForAction(action);
    if (points === 0) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.points += points;
    
    const newBadges = PointsCalculator.checkNewBadges(user);
    if (newBadges.length > 0) {
      user.badges = [...(user.badges || []), ...newBadges];
    }

    await user.save();

    res.json({
      points: user.points,
      badges: user.badges,
      newBadges,
      pointsEarned: points,
      action
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserPoints = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select("name email points badges");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const nextBadges = PointsCalculator.getNextBadgeProgress(user);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        points: user.points,
        badges: user.badges
      },
      nextBadges
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyPoints = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("points badges");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const nextBadges = PointsCalculator.getNextBadgeProgress(user);

    res.json({
      points: user.points,
      badges: user.badges,
      nextBadges
    });
  } catch (err) {
    next(err);
  }
};