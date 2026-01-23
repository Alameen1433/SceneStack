const { ObjectId } = require("mongodb");

const AVG_EPISODE_RUNTIME = 45;
const MILESTONE_INCREMENT = 100; // Notify every 100 hours

const calculateTotalWatchTimeMinutes = (watchlistItems) => {
  let totalMinutes = 0;

  for (const item of watchlistItems) {
    if (item.media_type === "movie") {
      if (item.watched) {
        totalMinutes += item.runtime || 0;
      }
    } else if (item.media_type === "tv") {
      const watchedEpisodesMap = item.watchedEpisodes || {};
      const episodeCount = Object.values(watchedEpisodesMap).reduce(
        (acc, eps) => acc + (Array.isArray(eps) ? eps.length : 0),
        0
      );

      if (episodeCount > 0) {
        // Use show's episode_run_time if available (it's an array), otherwise fallback
        const episodeRuntime =
          Array.isArray(item.episode_run_time) && item.episode_run_time.length > 0
            ? item.episode_run_time[0]
            : AVG_EPISODE_RUNTIME;
        totalMinutes += episodeCount * episodeRuntime;
      }
    }
  }

  return totalMinutes;
};

const checkAndTriggerMilestones = async (
  userId,
  watchlistCollection,
  usersCollection,
  notificationCollection,
  broadcastToUser
) => {
  try {
    const userObjectId = new ObjectId(userId);
    const [watchlistItems, user] = await Promise.all([
      watchlistCollection.find({ userId }).toArray(),
      usersCollection.findOne({ _id: userObjectId }),
    ]);

    if (!user) return;

    const totalMinutes = calculateTotalWatchTimeMinutes(watchlistItems);
    const totalHours = Math.floor(totalMinutes / 60);

    // Default to 0 if not set
    const lastNotified = user.lastNotifiedMilestone || 0;

    // Check if we crossed a new multiple of 100
    // Example: totalHours = 250, lastNotified = 100. Next milestone is 200.
    // We want to find the highest multiple of 100 <= totalHours
    const currentMilestone = Math.floor(totalHours / MILESTONE_INCREMENT) * MILESTONE_INCREMENT;

    if (currentMilestone > lastNotified && currentMilestone > 0) {
      // Create notification
      const notification = {
        userId,
        type: "milestone",
        title: "Milestone Reached!",
        message: `Congrats! You’ve officially spent ${currentMilestone} hours watching content.`,
        data: {
          hours: currentMilestone,
        },
        isRead: false,
        createdAt: new Date(),
      };

      await notificationCollection.insertOne(notification);

      // Update user
      await usersCollection.updateOne(
        { _id: userObjectId },
        { $set: { lastNotifiedMilestone: currentMilestone } }
      );

      // Broadcast
      broadcastToUser(userId, "notification:new", notification);
      console.log(`Milestone notification triggered for user ${userId}: ${currentMilestone} hours`);
    }
  } catch (err) {
    console.error("Error in checkAndTriggerMilestones:", err);
  }
};

module.exports = {
  checkAndTriggerMilestones,
};
