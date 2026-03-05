const POINTS = {
  ADD_SPOT: 50,
  ADD_REVIEW: 30,
  ADD_RATING: 20,
  POST_EVENT: 40,
  JOIN_EVENT: 10,
  REPORT_INCORRECT: 15,
  EVENT_SUCCESSFUL_BONUS: 100,
  PERFECT_HOST_BONUS: 200,
  WRONG_REPORT_PENALTY: -50,
  INAPPROPRIATE_CONTENT: -100
};

const BADGE_REQUIREMENTS = {
  EXPLORER: { points: 200, description: "Added 5+ spots" },
  CRITIC: { points: 150, description: "Written 10+ reviews" },
  ORGANIZER: { points: 300, description: "Hosted 5+ successful events" },
  GUARDIAN: { points: 100, description: "Reported 10+ incorrect listings" },
  PERFECT_HOST: { points: 500, description: "Achieved 100% positive endorsements" },
  DEDICATED: { count: 3, description: "Stayed when host ditched 3+ times" }
};

class PointsCalculator {
  static getPointsForAction(action) {
    return POINTS[action] || 0;
  }

  static checkNewBadges(user) {
    const newBadges = [];
    const currentBadges = user.badges || [];

    if (user.points >= BADGE_REQUIREMENTS.EXPLORER.points && !currentBadges.includes("Explorer")) {
      newBadges.push("Explorer");
    }

    if (user.points >= BADGE_REQUIREMENTS.CRITIC.points && !currentBadges.includes("Critic")) {
      newBadges.push("Critic");
    }

    if (user.points >= BADGE_REQUIREMENTS.ORGANIZER.points && !currentBadges.includes("Organizer")) {
      newBadges.push("Organizer");
    }

    if (user.points >= BADGE_REQUIREMENTS.GUARDIAN.points && !currentBadges.includes("Guardian")) {
      newBadges.push("Guardian");
    }

    if (user.points >= BADGE_REQUIREMENTS.PERFECT_HOST.points && !currentBadges.includes("Perfect Host")) {
      newBadges.push("Perfect Host");
    }

    if (user.dedicatedCount >= BADGE_REQUIREMENTS.DEDICATED.count && !currentBadges.includes("Dedicated")) {
      newBadges.push("Dedicated");
    }

    return newBadges;
  }

  static getNextBadgeProgress(user) {
    const currentBadges = user.badges || [];
    const allBadges = ["Explorer", "Critic", "Organizer", "Guardian", "Perfect Host", "Dedicated"];
    const nextBadges = [];

    for (const badge of allBadges) {
      if (!currentBadges.includes(badge)) {
        if (badge === "Dedicated") {
          const required = BADGE_REQUIREMENTS.DEDICATED.count;
          const progress = Math.min(100, Math.floor(((user.dedicatedCount || 0) / required) * 100));
          nextBadges.push({
            name: badge,
            required: `${required} ditched events`,
            progress,
            remaining: Math.max(0, required - (user.dedicatedCount || 0))
          });
        } else {
          const required = BADGE_REQUIREMENTS[badge.toUpperCase().replace(" ", "_")].points;
          const progress = Math.min(100, Math.floor((user.points / required) * 100));
          nextBadges.push({
            name: badge,
            required: `${required} points`,
            progress,
            remaining: Math.max(0, required - user.points)
          });
        }
      }
    }

    return nextBadges;
  }
}

module.exports = { PointsCalculator, POINTS, BADGE_REQUIREMENTS };