const { ObjectId } = require("mongodb");

const AVG_EPISODE_RUNTIME = 45;
const MILESTONE_INCREMENT = 100; // Notify every 100 hours

const calculateItemRuntime = (item) => {
  if (!item) return 0;

  if (item.media_type === "movie") {
    return item.watched ? item.runtime || 0 : 0;
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
    
    // 1. Get current state (or calculate initial)
    let user = await usersCollection.findOne({ _id: userObjectId });
    if (!user) return;

    let newTotalMinutes = 0;

    // A. Initial Calculation (Rare: only for new/legacy users)
    if (typeof user.totalWatchTimeMinutes !== "number") {
      console.log(`Calculating initial watch time for user ${userId}...`);
      const allItems = await watchlistCollection.find({ userId }).toArray();
      newTotalMinutes = calculateTotalWatchTimeMinutes(allItems);

      const result = await usersCollection.findOneAndUpdate(
        { _id: userObjectId },
        { $set: { totalWatchTimeMinutes: newTotalMinutes } },
        { returnDocument: "after" }
      );
      // Depending on driver version, result might be the doc or { value: doc }
      // Using defensive check assuming standard { value: ... } or direct doc
      user = result.value || result; 
      if (user) newTotalMinutes = user.totalWatchTimeMinutes;

    } else {
      // B. Atomic Increment (Common Path)
      const oldRuntime = calculateItemRuntime(oldItem);
      const newRuntime = calculateItemRuntime(newItem);
      const delta = newRuntime - oldRuntime;

      if (delta === 0) return;

      const result = await usersCollection.findOneAndUpdate(
        { _id: userObjectId },
        { $inc: { totalWatchTimeMinutes: delta } },
        { returnDocument: "after" } // Ensure we get the updated value
      );
      
      user = result.value || result;
      if (!user) return; // Should not happen
      newTotalMinutes = user.totalWatchTimeMinutes;
    }

    // 2. Check Milestones safely
    const totalHours = Math.floor(newTotalMinutes / 60);
    const currentMilestone = Math.floor(totalHours / MILESTONE_INCREMENT) * MILESTONE_INCREMENT;

    // 3. Conditional Update (The "Notification Lock")
    // Only update if we haven't notified for this milestone (or higher) yet.
    // This prevents race conditions where two concurrent requests both calculate 100h.
    // Treat undefined unique lastNotified as 0 via $lt check if field missing, 
    // but MongoDB comparison with null/missing is tricky. 
    // We rely on the initial findOne 'user' fallback for the $lt check? No, must be atomic.
    // We can use { $lt: currentMilestone } on the field. If field is missing, it's not less than number?
    // Actually, $lt comparison with null/missing: null < numbers.
    // So if lastNotifiedMilestone is missing, it is "less than" 100.
    
    if (currentMilestone > 0) {
        // Query: Update IF currentMilestone is strictly greater than what's in DB
        // Effectively: "Claim this milestone"
        const updateResult = await usersCollection.updateOne(
            { 
                _id: userObjectId, 
                $or: [
                    { lastNotifiedMilestone: { $lt: currentMilestone } },
                    { lastNotifiedMilestone: { $exists: false } }
                ]
            },
            { $set: { lastNotifiedMilestone: currentMilestone } }
        );

        if (updateResult.modifiedCount > 0) {
            // We won the race. Send the notification.
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
            broadcastToUser(userId, "notification:new", notification);
            console.log(`Milestone notification triggered for user ${userId}: ${currentMilestone} hours`);
        }
    }
  } catch (err) {
    console.error("Error in updateWatchTimeAndCheckMilestones:", err);
  }
};

const checkAndTriggerMilestonesFull = async (
  userId,
  watchlistCollection,
  usersCollection,
  notificationCollection,
  broadcastToUser
) => {
  try {
    const userObjectId = new ObjectId(userId);
    const allItems = await watchlistCollection.find({ userId }).toArray();
    const totalMinutes = calculateTotalWatchTimeMinutes(allItems);

    await usersCollection.updateOne(
      { _id: userObjectId },
      { $set: { totalWatchTimeMinutes: totalMinutes } }
    );
    
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
  checkAndTriggerMilestonesFull,
};
