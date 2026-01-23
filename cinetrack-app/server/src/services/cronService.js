const cron = require("node-cron");
const { ObjectId } = require("mongodb");

const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_API_TOKEN = process.env.TMDB_API_READ_ACCESS_TOKEN;

const fetchFromTMDB = async (endpoint) => {
  const url = `${TMDB_API_BASE_URL}/${endpoint}`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${TMDB_API_TOKEN}`,
      },
    });
    if (!response.ok) return null;
    return response.json();
  } catch (err) {
    console.error(`TMDB fetch error for ${endpoint}:`, err.message);
    return null;
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const checkPremiereAlerts = async (
  watchlistCollection,
  notificationCollection,
  broadcastToUser
) => {
  console.log("Starting Premiere Alert check...");
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  try {
    // 1. Find all unique TV shows being watched or watched by anyone
    const pipeline = [
      {
        $match: {
          media_type: "tv",
          watchlistStatus: { $in: ["watching", "watched"] },
        },
      },
      {
        $group: {
          _id: "$id",
          userIds: { $push: "$userId" },
          titles: { $first: "$name" }, // Keep a title reference
        },
      },
    ];

    const showsToCheck = await watchlistCollection.aggregate(pipeline).toArray();
    console.log(`Checking ${showsToCheck.length} unique TV shows for premieres...`);

    for (const show of showsToCheck) {
      const tvId = show._id;
      const details = await fetchFromTMDB(`tv/${tvId}`);
      await delay(200); // Throttling: 5 req/sec max

      if (!details) continue;

      let notificationMessage = null;
      let notificationTitle = "Premiere Alert!";

      // Check next episode
      const nextEp = details.next_episode_to_air;
      if (nextEp && nextEp.air_date === today) {
        if (nextEp.episode_number === 1) {
          notificationMessage = `New Season ${nextEp.season_number} of ${details.name} starts today!`;
        } else {
           // Optional: Notify for every episode?
           // The requirement says "Premiere Alerts: New Season... starts today!"
           // Maybe also "New Episode"?
           // Let's stick to Season Premieres or Series Premieres for high impact,
           // but the user asked for "like Premiere Alerts... New Season...".
           // If I want to be safe, I can just do Season Premieres.
           // However, for "watching" users, new episodes are important.
           // Let's restrict to Episode 1 for "Season Premiere" alerts as specifically requested examples imply high value.
           // If the user wants every episode, that's a lot of noise.
           // "New Season ... starts today" strongly implies Season 1 Ep 1, S2 Ep 1 etc.
        }
      }

      // Check seasons array for season premiere date (redundant if next_episode covers it, but safe)
      // Actually, next_episode_to_air is the most reliable source for "what is airing today".

      if (notificationMessage) {
        const userIds = show.userIds;

        // Create notifications for all users tracking this show
        const notifications = userIds.map((userId) => ({
          userId: userId,
          type: "premiere",
          title: notificationTitle,
          message: notificationMessage,
          data: {
            mediaId: tvId,
            mediaType: "tv",
          },
          isRead: false,
          createdAt: new Date(),
        }));

        if (notifications.length > 0) {
            await notificationCollection.insertMany(notifications);

            // Broadcast
            userIds.forEach((userId, index) => {
                broadcastToUser(userId, "notification:new", notifications[index]);
            });
            console.log(`Sent premiere alert for ${details.name} to ${userIds.length} users.`);
        }
      }
    }
    console.log("Premiere Alert check complete.");
  } catch (err) {
    console.error("Error in checkPremiereAlerts:", err);
  }
};

const initCronJobs = (watchlistCollection, notificationCollection, broadcastToUser) => {
  // Schedule to run every day at 12:00 PM UTC (or server time)
  // "0 12 * * *"
  // For testing, I might want to run it sooner, but for prod:
  cron.schedule("0 12 * * *", () => {
    checkPremiereAlerts(watchlistCollection, notificationCollection, broadcastToUser);
  });

  console.log("Cron jobs initialized: Premiere Alerts scheduled for 12:00 PM daily.");
};

module.exports = {
    initCronJobs,
    // Export for testing/manual trigger if needed
    checkPremiereAlerts
};
