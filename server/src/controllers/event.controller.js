const Event = require("../models/Event");
const Endorsement = require("../models/Endorsement");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { PointsCalculator } = require("../utils/pointsCalculator");
const { geocodeAddress } = require("../services/barikoi.service");

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

exports.createEvent = async (req, res, next) => {
  try {
    const { title, topic, description, date, time, location, maxAttendees } = req.body;

    if (!title || !topic || !date || !time || !location || !maxAttendees) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const geocodeResult = await geocodeAddress(location);

    const event = await Event.create({
      title, topic, description,
      date: new Date(date), time, location,
      coordinates: {
        lat: geocodeResult.lat,
        lng: geocodeResult.lng
      },
      formattedAddress: geocodeResult.formattedAddress,
      placeId: geocodeResult.placeId,
      maxAttendees,
      host: req.user.id,
      pointsAwarded: false,
      hostPointsAwarded: false
    });

    await event.populate("host", "name email points badges profilePhoto");

    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
};

exports.getEvents = async (req, res, next) => {
  try {
    const { topic, status = "upcoming", search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const filter = { status };
    if (topic && topic !== "All") filter.topic = topic;
    if (search) filter.title = { $regex: search, $options: "i" };

    const events = await Event.find(filter)
      .populate("host", "name email points badges profilePhoto _id")
      .sort({ date: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(filter);
    if (req.user) {
      events.forEach(event => {
        event._doc.isAttending = event.isUserAttending(req.user.id);
        event._doc.isFavorited = event.isUserFavorited(req.user.id);
        if (event.status === "cancelled") event._doc.isCancelled = true;
      });
    }
    res.json({
      events,
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

exports.getEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id)
      .populate("host", "name email points badges profilePhoto _id")
      .populate("attendees", "name email points badges profilePhoto");
      
    if (!event) return res.status(404).json({ message: "Event not found" });
    
    if (req.user) {
      const rawEvent = await Event.findById(id).select('attendees favorites userCalendarEvents');
      if (rawEvent) {
        event._doc.isAttending = rawEvent.attendees.some(
          attId => attId.toString() === req.user.id
        );
        event._doc.isFavorited = rawEvent.favorites.some(
          favId => favId.toString() === req.user.id
        );
        event._doc.hasSynced = rawEvent.userCalendarEvents && 
                               rawEvent.userCalendarEvents.has(req.user.id);
      } else {
        event._doc.isAttending = false;
        event._doc.isFavorited = false;
        event._doc.hasSynced = false;
      }
    } else {
      event._doc.hasSynced = false;
    }
    
    res.json({ event });
  } catch (err) {
    next(err);
  }
};

exports.joinEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.host.toString() === req.user.id) {
      return res.status(400).json({ message: "Host cannot join their own event" });
    }

    const eventDate = new Date(event.date);
    if (eventDate < new Date()) {
      return res.status(400).json({ message: "Cannot join past events" });
    }
    if (event.status !== "upcoming") {
      return res.status(400).json({ message: "Cannot join completed or cancelled event" });
    }
    if (event.isFull) {
      return res.status(400).json({ message: "Event is full" });
    }
    if (event.isUserAttending(req.user.id)) {
      return res.status(400).json({ message: "Already joined this event" });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentJoins = await Event.countDocuments({
      attendees: req.user.id,
      createdAt: { $gte: oneHourAgo }
    });
    if (recentJoins >= 5) {
      return res.status(429).json({ message: "You're joining too many events. Please wait." });
    }

    event.attendees.push(req.user.id);
    await event.save();

    const user = await User.findById(req.user.id);
    if (!user.joinedEvents.includes(event._id)) {
      user.joinedEvents.push(event._id);
      await user.save();
    }

    const updatedEvent = await Event.findById(id).populate("host", "name email points badges profilePhoto _id");
    updatedEvent._doc.isAttending = true;
    res.json({
      message: "Successfully joined event. Points will be awarded after attending for 30 minutes.",
      event: { ...updatedEvent.toObject(), isAttending: true, spotsFilled: updatedEvent.attendees.length }
    });
  } catch (err) {
    next(err);
  }
};

exports.leaveEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const eventDate = new Date(event.date);
    if (eventDate < new Date()) {
      return res.status(400).json({ message: "Cannot leave past events" });
    }
    if (event.status !== "upcoming") {
      return res.status(400).json({ message: "Cannot leave completed or cancelled event" });
    }
    if (!event.isUserAttending(req.user.id)) {
      return res.status(400).json({ message: "Not attending this event" });
    }

    // Remove from Google Calendar if synced (robust error handling)
    try {
      const { deleteCalendarEvent } = require("../services/calendar.service");
      if (event.userCalendarEvents && event.userCalendarEvents.has(req.user.id)) {
        const calendarEventId = event.userCalendarEvents.get(req.user.id);
        await deleteCalendarEvent(req.user.id, calendarEventId);
        event.userCalendarEvents.delete(req.user.id);
      }
    } catch (err) {
      console.error("Failed to delete calendar event during leave:", err.message);
      // Continue even if deletion fails
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentLeaves = await Event.countDocuments({
      attendees: req.user.id,
      updatedAt: { $gte: oneHourAgo }
    });
    if (recentLeaves >= 5) {
      return res.status(429).json({ message: "You're leaving too many events. Please wait." });
    }

    event.attendees = event.attendees.filter(id => id.toString() !== req.user.id);
    await event.save();

    const user = await User.findById(req.user.id);
    user.joinedEvents = user.joinedEvents.filter(eId => eId.toString() !== event._id.toString());
    await user.save();

    const now = new Date();
    const hoursUntilEvent = (eventDate - now) / (1000 * 60 * 60);
    if (hoursUntilEvent < 2) {
      user.noShowCount = (user.noShowCount || 0) + 1;
      if (user.noShowCount >= 5) {
        user.points = Math.max(0, user.points - 50);
        user.noShowCount = 0;
        user.lastPenalty = new Date();
      }
      await user.save();
    }

    const updatedEvent = await Event.findById(id).populate("host", "name email points badges profilePhoto _id");
    updatedEvent._doc.isAttending = false;
    res.json({
      message: "Successfully left event",
      event: { ...updatedEvent.toObject(), isAttending: false, spotsFilled: updatedEvent.attendees.length }
    });
  } catch (err) {
    next(err);
  }
};

exports.toggleFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    const isFavorited = event.isUserFavorited(req.user.id);
    if (isFavorited) {
      event.favorites = event.favorites.filter(uid => uid.toString() !== req.user.id);
    } else {
      event.favorites.push(req.user.id);
    }
    await event.save();
    res.json({ isFavorited: !isFavorited, favoritesCount: event.favorites.length });
  } catch (err) {
    next(err);
  }
};

exports.shareEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    event.shareCount += 1;
    await event.save();
    res.json({ shareCount: event.shareCount });
  } catch (err) {
    next(err);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.host.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (event.status === "cancelled") {
      return res.json({ message: "Event already cancelled" });
    }

    // Remove from Google Calendar for all users who synced (robust error handling)
    try {
      const { deleteCalendarEvent } = require("../services/calendar.service");
      if (event.userCalendarEvents && event.userCalendarEvents.size > 0) {
        for (const [userId, calendarEventId] of event.userCalendarEvents.entries()) {
          try {
            await deleteCalendarEvent(userId, calendarEventId);
          } catch (err) {
            console.error(`Failed to delete calendar event for user ${userId}:`, err.message);
          }
        }
      }
    } catch (err) {
      console.error("Calendar deletion error during event cancellation:", err);
    }

    const now = new Date();
    const eventDate = new Date(event.date);
    const hoursUntilEvent = (eventDate - now) / (1000 * 60 * 60);
    if (hoursUntilEvent < 48 && hoursUntilEvent >= 24) {
      const host = await User.findById(event.host);
      host.points = Math.max(0, host.points - 100);
      host.eventsDitched = (host.eventsDitched || 0) + 1;
      if (host.eventsDitched >= 3) {
        host.points = Math.max(0, host.points - 200);
        host.badges = host.badges.filter(b => b !== "Organizer");
      }
      await host.save();
    } else if (hoursUntilEvent < 24) {
      const host = await User.findById(event.host);
      host.points = Math.max(0, host.points - 150);
      host.eventsDitched = (host.eventsDitched || 0) + 1;
      if (host.eventsDitched >= 3) {
        host.points = Math.max(0, host.points - 200);
        host.badges = host.badges.filter(b => b !== "Organizer");
      }
      await host.save();
    }

    event.status = "cancelled";
    event.cancelledAt = now;
    await event.save();

    for (const attendeeId of event.attendees) {
      await Notification.create({
        user: attendeeId,
        type: "event_cancelled",
        title: "Event Cancelled",
        message: `The event "${event.title}" scheduled for ${new Date(event.date).toLocaleDateString()} at ${event.time} has been cancelled by the host.`,
        event: event._id
      });
    }
    res.json({ message: "Event cancelled successfully. Removed from Google Calendar if synced." });
  } catch (err) {
    next(err);
  }
};

exports.completeEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.host.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the host can complete the event" });
    }
    if (event.status === "completed") {
      return res.status(400).json({ message: "Event already completed" });
    }
    if (!event.hostPresent || !event.startedAt) {
      return res.status(400).json({ message: "Host must be present at the event location" });
    }
    const now = new Date();
    const hostDuration = (now - event.startedAt) / (1000 * 60);
    if (hostDuration < 30) {
      return res.status(400).json({ message: `Host must be at the event location for at least 30 minutes. Current duration: ${Math.floor(hostDuration)} minutes` });
    }
    event.status = "completed";
    event.endedAt = now;
    event.hostCompleted = true;
    if (!event.hostPointsAwarded) {
      const host = await User.findById(event.host);
      host.points += 40;
      const newBadges = PointsCalculator.checkNewBadges(host);
      if (newBadges.length > 0) {
        host.badges = [...(host.badges || []), ...newBadges];
        for (const badge of newBadges) {
          await Notification.create({
            user: host._id,
            type: "badge_earned",
            title: "New Badge Earned!",
            message: `Congratulations! You've earned the ${badge} badge.`
          });
        }
      }
      await host.save();
      event.hostPointsAwarded = true;
    }
    await event.save();
    res.json({ message: "Event completed successfully", event });
  } catch (err) {
    next(err);
  }
};

exports.trackLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    const now = new Date();
    const eventTime = new Date(event.date);
    const [hours, minutes] = event.time.split(':').map(Number);
    eventTime.setHours(hours, minutes, 0, 0);
    const minutesDiff = Math.abs((now - eventTime) / (1000 * 60));
    if (minutesDiff > 180) {
      return res.status(400).json({ message: "Not within tracking window" });
    }
    const distance = calculateDistance(lat, lng, event.coordinates.lat, event.coordinates.lng);
    const isWithinRadius = distance <= (event.radius || 100);
    if (req.user.id === event.host.toString()) {
      if (isWithinRadius) {
        if (!event.hostPresent) {
          event.hostPresent = true;
          event.startedAt = now;
          event.status = "ongoing";
        }
        event.hostLastSeen = now;
      } else {
        event.hostPresent = false;
      }
      await event.save();
      return res.json({ role: "host", withinRadius: isWithinRadius, hostPresent: event.hostPresent, startedAt: event.startedAt, status: event.status, distance });
    }
    if (event.attendees.includes(req.user.id)) {
      const timer = event.getTimerForUser(req.user.id);
      if (event.status === "ongoing" && event.hostPresent) {
        if (isWithinRadius) {
          if (!timer.joinedAt) timer.joinedAt = now;
          timer.lastSeenAt = now;
          timer.hostWasPresent = true;
          const continuousMinutes = (now - timer.joinedAt) / (1000 * 60);
          timer.totalMinutes = continuousMinutes;
          if (continuousMinutes >= 1 && !timer.present) {
            timer.present = true;
            if (!event.attendeesPresent.includes(req.user.id)) event.attendeesPresent.push(req.user.id);
          }
          if (continuousMinutes >= 30 && !timer.completed) {
            timer.completed = true;
            timer.completedAt = now;
            if (!event.attendeesCompleted.includes(req.user.id)) {
              event.attendeesCompleted.push(req.user.id);
              const user = await User.findById(req.user.id);
              const alreadyCompleted = user.completedEvents?.includes(event._id);
              if (!alreadyCompleted) {
                let pointsEarned = 0;
                if (timer.hostWasPresent) {
                  pointsEarned = 10;
                  user.points += 10;
                } else {
                  pointsEarned = 20;
                  user.points += 20;
                  user.dedicatedCount = (user.dedicatedCount || 0) + 1;
                  if (user.dedicatedCount >= 3 && !user.badges.includes("Dedicated")) {
                    user.badges.push("Dedicated");
                    await Notification.create({
                      user: user._id,
                      type: "badge_earned",
                      title: "New Badge Earned!",
                      message: "Congratulations! You've earned the Dedicated badge for staying when hosts ditched."
                    });
                  }
                }
                user.completedEvents = [...(user.completedEvents || []), event._id];
                await Notification.create({
                  user: user._id,
                  type: "points_earned",
                  title: "Points Earned!",
                  message: `You earned ${pointsEarned} points for attending "${event.title}".`,
                  event: event._id
                });
                const newBadges = PointsCalculator.checkNewBadges(user);
                if (newBadges.length > 0) {
                  user.badges = [...(user.badges || []), ...newBadges];
                  for (const badge of newBadges) {
                    await Notification.create({
                      user: user._id,
                      type: "badge_earned",
                      title: "New Badge Earned!",
                      message: `Congratulations! You've earned the ${badge} badge.`
                    });
                  }
                }
                await user.save();
              }
            }
          }
        } else {
          timer.joinedAt = null;
          timer.lastSeenAt = null;
        }
      }
      event.attendeeTimers.set(req.user.id.toString(), timer);
      await event.save();
      return res.json({
        role: "attendee",
        withinRadius: isWithinRadius,
        hostPresent: event.hostPresent,
        eventStatus: event.status,
        timer: {
          joined: !!timer.joinedAt,
          minutes: timer.joinedAt ? Math.floor((now - timer.joinedAt) / (1000 * 60)) : 0,
          present: timer.present,
          completed: timer.completed,
          totalMinutes: Math.floor(timer.totalMinutes || 0)
        },
        distance
      });
    }
    res.json({ withinRadius: isWithinRadius, distance });
  } catch (err) {
    next(err);
  }
};

exports.getEventStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id)
      .populate("host", "name")
      .populate("attendeesPresent", "name");
    if (!event) return res.status(404).json({ message: "Event not found" });
    const timers = {};
    if (req.user) {
      const timer = event.getTimerForUser(req.user.id);
      timers[req.user.id] = {
        minutes: Math.floor(timer.totalMinutes || 0),
        present: timer.present,
        completed: timer.completed
      };
    }
    res.json({
      hostPresent: event.hostPresent,
      startedAt: event.startedAt,
      status: event.status,
      attendeesPresent: event.attendeesPresent.length,
      attendeesCompleted: event.attendeesCompleted.length,
      totalAttendees: event.attendees.length,
      presentList: event.attendeesPresent,
      timers
    });
  } catch (err) {
    next(err);
  }
};

exports.markAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { attendeeIds } = req.body;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.host.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only host can mark attendance" });
    }
    if (event.status !== "completed") event.status = "completed";
    event.attendeesPresent = attendeeIds;
    await event.save();
    const endorsements = [];
    for (const attendeeId of attendeeIds) {
      endorsements.push({ event: event._id, attendee: attendeeId, host: event.host, present: true });
    }
    await Endorsement.insertMany(endorsements);
    res.json({ message: "Attendance marked", presentCount: attendeeIds.length, totalAttendees: event.attendees.length });
  } catch (err) {
    next(err);
  }
};

exports.submitEndorsement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { endorsed } = req.body;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.status !== "completed") {
      return res.status(400).json({ message: "Event not completed yet" });
    }
    if (!event.attendeesPresent.includes(req.user.id)) {
      return res.status(400).json({ message: "You were not marked as present" });
    }
    let endorsement = await Endorsement.findOne({ event: event._id, attendee: req.user.id });
    if (!endorsement) {
      endorsement = new Endorsement({ event: event._id, attendee: req.user.id, host: event.host });
    }
    endorsement.endorsed = endorsed;
    endorsement.present = true;
    await endorsement.save();
    const totalPresent = event.attendeesPresent.length;
    const totalEndorsements = await Endorsement.countDocuments({ event: event._id, endorsed: true });
    const endorsementPercentage = totalPresent > 0 ? (totalEndorsements / totalPresent) * 100 : 0;
    event.endorsement = Math.round(endorsementPercentage);
    if (endorsementPercentage >= 60) {
      event.isSuccessful = true;
      const host = await User.findById(event.host);
      let bonusPoints = totalPresent < 5 ? 50 : 100;
      host.points += bonusPoints;
      await Notification.create({
        user: host._id,
        type: "points_earned",
        title: "Bonus Points!",
        message: `You earned ${bonusPoints} bonus points for a successful event "${event.title}".`,
        event: event._id
      });
      if (endorsementPercentage === 100 && totalPresent >= 3) {
        host.points += 200;
        if (!host.badges.includes("Perfect Host")) {
          host.badges.push("Perfect Host");
          await Notification.create({
            user: host._id,
            type: "badge_earned",
            title: "New Badge Earned!",
            message: "Congratulations! You've earned the Perfect Host badge for 100% endorsements."
          });
        }
      }
      const newBadges = PointsCalculator.checkNewBadges(host);
      if (newBadges.length > 0) {
        host.badges = [...(host.badges || []), ...newBadges];
        for (const badge of newBadges) {
          await Notification.create({
            user: host._id,
            type: "badge_earned",
            title: "New Badge Earned!",
            message: `Congratulations! You've earned the ${badge} badge.`
          });
        }
      }
      await host.save();
    }
    event.status = "completed";
    await event.save();
    res.json({
      endorsement: endorsementPercentage,
      isSuccessful: event.isSuccessful,
      message: event.isSuccessful ? "Event successful! Host earned bonus points." : "Endorsement recorded."
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ attendees: req.user.id })
      .populate("host", "name email points badges profilePhoto _id")
      .sort({ date: 1 });
    events.forEach(event => {
      if (event.status === "cancelled") event._doc.isCancelled = true;
    });
    res.json({ events });
  } catch (err) {
    next(err);
  }
};

exports.getHostedEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ host: req.user.id })
      .populate("attendees", "name email profilePhoto")
      .sort({ date: -1 });
    res.json({ events });
  } catch (err) {
    next(err);
  }
};

exports.removeCalendarEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    const userId = req.user.id;
    const calendarEventId = event.userCalendarEvents?.get(userId);
    if (!calendarEventId) {
      return res.status(404).json({ message: "No calendar event found for this user" });
    }
    const { deleteCalendarEvent } = require("../services/calendar.service");
    const result = await deleteCalendarEvent(userId, calendarEventId);
    if (result.success) {
      event.userCalendarEvents.delete(userId);
      await event.save();
      res.json({ message: "Calendar event removed" });
    } else {
      res.status(500).json({ message: "Failed to remove calendar event", error: result.error });
    }
  } catch (err) {
    next(err);
  }
};