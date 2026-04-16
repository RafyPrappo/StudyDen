const User = require("../models/User");

exports.getLeaderboard = async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const users = await User.find({ role: { $ne: "admin" } })
      .select("name email points badges profilePhoto")
      .sort({ points: -1, updatedAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments({ role: { $ne: "admin" } });

    const usersWithRank = users.map((user, index) => ({
      rank: skip + index + 1,
      id: user._id,
      name: user.name,
      email: user.email,
      points: user.points,
      badges: user.badges || [],
      profilePhoto: user.profilePhoto || "",
      role: user.role
    }));

    res.json({
      users: usersWithRank,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ message: "Failed to load leaderboard" });
  }
};

exports.getUserRank = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("name points badges profilePhoto role").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Admins are excluded from ranking
    if (user.role === "admin") {
      return res.json({
        userId: user._id,
        name: user.name,
        points: user.points,
        badges: user.badges || [],
        profilePhoto: user.profilePhoto || "",
        rank: null,
        total: await User.countDocuments({ role: { $ne: "admin" } })
      });
    }

    const rank = await User.countDocuments({ 
      points: { $gt: user.points },
      role: { $ne: "admin" }
    }) + 1;
    
    const total = await User.countDocuments({ role: { $ne: "admin" } });

    res.json({
      userId: user._id,
      name: user.name,
      points: user.points,
      badges: user.badges || [],
      profilePhoto: user.profilePhoto || "",
      rank,
      total
    });
  } catch (err) {
    console.error("User rank error:", err);
    res.status(500).json({ message: "Failed to load user rank" });
  }
};

exports.getMyRank = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("name points badges profilePhoto role").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.json({
        name: user.name,
        points: user.points,
        badges: user.badges || [],
        profilePhoto: user.profilePhoto || "",
        rank: null,
        total: await User.countDocuments({ role: { $ne: "admin" } })
      });
    }

    const rank = await User.countDocuments({ 
      points: { $gt: user.points },
      role: { $ne: "admin" }
    }) + 1;
    
    const total = await User.countDocuments({ role: { $ne: "admin" } });

    res.json({
      name: user.name,
      points: user.points,
      badges: user.badges || [],
      profilePhoto: user.profilePhoto || "",
      rank,
      total
    });
  } catch (err) {
    console.error("My rank error:", err);
    res.status(500).json({ message: "Failed to load your rank" });
  }
};