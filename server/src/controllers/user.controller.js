const User = require("../models/User");
const Event = require("../models/Event");
const Notification = require("../models/Notification");
const fs = require("fs");
const path = require("path");

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
      // Get just the filename from the stored path
      const filename = user.profilePhoto.replace('/uploads/', '');
      const filepath = path.join(__dirname, '../../uploads', filename);
      
      console.log("Attempting to delete file:", filepath);
      
      try {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
          console.log("Successfully deleted file:", filepath);
        } else {
          console.log("File does not exist:", filepath);
        }
      } catch (err) {
        console.error("Error deleting file:", err);
      }
    } else {
      console.log("No profile photo to delete");
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