const { ObjectId } = require("mongodb");

const AVG_EPISODE_RUNTIME = 45;
const MILESTONE_INCREMENT = 100; // Notify every 100 hours

const calculateItemRuntime = (item) => {
  if (!item) return 0;

  // Only count watched items or watched episodes
  if (item.media_type === "movie") {
    return item.watched ? (item.runtime || 0) : 0;
  } else if (item.media_type === "tv") {
    const watchedEpisodesMap = item.watchedEpisodes || {};
    const episodeCount = Object.values(watchedEpisodesMap).reduce(
      (acc, eps) => acc + (Array.isArray(eps) ? eps.length : 0),
      0
    );

    if (episodeCount > 0) {
      const episodeRuntime =
        Array.isArray(item.episode_run_time) && item.episode_run_time.length > 0
          ? item.episode_run_time[0]
          : AVG_EPISODE_RUNTIME;
      return episodeCount * episodeRuntime;
    }
  }
  return 0;
};

// Full calculation fallback
const calculateTotalWatchTimeMinutes = (watchlistItems) => {
  let totalMinutes = 0;
  for (const item of watchlistItems) {
    totalMinutes += calculateItemRuntime(item);
  }
  return totalMinutes;
};

const updateWatchTimeAndCheckMilestones = async (
  userId,
  oldItem,
  newItem,
  watchlistCollection,
  usersCollection,
  notificationCollection,
  broadcastToUser
) => {
  try {
    const userObjectId = new ObjectId(userId);
    let user = await usersCollection.findOne({ _id: userObjectId });
    if (!user) return;

    let totalMinutes = user.totalWatchTimeMinutes;

    // Lazy Migration: If totalWatchTimeMinutes is undefined, calculate it fully once
    if (typeof totalMinutes !== "number") {
      console.log(`Calculating initial watch time for user ${userId}...`);
      const allItems = await watchlistCollection.find({ userId }).toArray();
      totalMinutes = calculateTotalWatchTimeMinutes(allItems);

      await usersCollection.updateOne(
        { _id: userObjectId },
        { $set: { totalWatchTimeMinutes: totalMinutes } }
      );
    } else {
      // Incremental Update
      const oldRuntime = calculateItemRuntime(oldItem);
      const newRuntime = calculateItemRuntime(newItem);
      const delta = newRuntime - oldRuntime;

      if (delta !== 0) {
        totalMinutes += delta;
        await usersCollection.updateOne(
          { _id: userObjectId },
          { $inc: { totalWatchTimeMinutes: delta } }
        );
      }
    }

    const totalHours = Math.floor(totalMinutes / 60);
    const lastNotified = user.lastNotifiedMilestone || 0;
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

      // Update user lastNotified
      await usersCollection.updateOne(
        { _id: userObjectId },
        { $set: { lastNotifiedMilestone: currentMilestone } }
      );

      // Broadcast
      broadcastToUser(userId, "notification:new", notification);
      console.log(`Milestone notification triggered for user ${userId}: ${currentMilestone} hours`);
    }
  } catch (err) {
    console.error("Error in updateWatchTimeAndCheckMilestones:", err);
  }
};

// Keep the old function for full re-calcs (e.g. import) but redirect to optimized flow if possible?
// Actually, import replaces everything, so full calc is best.
const checkAndTriggerMilestonesFull = async (
    userId,
    watchlistCollection,
    usersCollection,
    notificationCollection,
    broadcastToUser
  ) => {
    // Force full recalculation
    try {
        const userObjectId = new ObjectId(userId);
        const allItems = await watchlistCollection.find({ userId }).toArray();
        const totalMinutes = calculateTotalWatchTimeMinutes(allItems);

        await usersCollection.updateOne(
            { _id: userObjectId },
            { $set: { totalWatchTimeMinutes: totalMinutes } }
        );

        // Re-fetch user to check milestones logic simply by passing nulls?
        // Or just copy-paste the check logic.
        // Let's call updateWatchTime... with old=null, new=null and force it to use the DB value?
        // No, let's just do the check here.

        const user = await usersCollection.findOne({ _id: userObjectId });
        const totalHours = Math.floor(totalMinutes / 60);
        const lastNotified = user.lastNotifiedMilestone || 0;
        const currentMilestone = Math.floor(totalHours / MILESTONE_INCREMENT) * MILESTONE_INCREMENT;

        if (currentMilestone > lastNotified && currentMilestone > 0) {
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

              await usersCollection.updateOne(
                { _id: userObjectId },
                { $set: { lastNotifiedMilestone: currentMilestone } }
              );

              broadcastToUser(userId, "notification:new", notification);
        }

    } catch (err) {
        console.error("Error in checkAndTriggerMilestonesFull:", err);
    }
  };

module.exports = {
  updateWatchTimeAndCheckMilestones,
  checkAndTriggerMilestonesFull
};
