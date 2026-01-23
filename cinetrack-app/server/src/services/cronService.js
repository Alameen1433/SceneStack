const cron = require("node-cron");
const { ObjectId } = require("mongodb");
const { cache } = require("../config");

const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_API_TOKEN = process.env.TMDB_API_READ_ACCESS_TOKEN;
const CONCURRENCY_LIMIT = 5;

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

const getCachedTVDetails = async (tvId) => {
    const cacheKey = `tmdb:tv:${tvId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const details = await fetchFromTMDB(`tv/${tvId}`);
    if (details) {
        // Cache for 24 hours (86400s)
        await cache.set(cacheKey, details, 86400);
    }
    return details;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Simple concurrency limiter
const mapAsync = async (array, limit, fn) => {
    const results = [];
    const executing = [];

    for (const item of array) {
        const p = Promise.resolve().then(() => fn(item));
        results.push(p);

        if (limit <= array.length) {
            const e = p.then(() => executing.splice(executing.indexOf(e), 1));
            executing.push(e);
            if (executing.length >= limit) {
                await Promise.race(executing);
            }
        }
    }
    return Promise.all(results);
};

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
          titles: { $first: "$name" },
        },
      },
    ];

    const showsToCheck = await watchlistCollection.aggregate(pipeline).toArray();
    console.log(`Checking ${showsToCheck.length} unique TV shows for premieres...`);

    // Process in batches
    await mapAsync(showsToCheck, CONCURRENCY_LIMIT, async (show) => {
        const tvId = show._id;
        const details = await getCachedTVDetails(tvId);

        if (!details) return;

        // Optimization: Skip ended shows if status is strictly "Ended" or "Canceled"
        // But re-runs or specials might happen? "Premiere" usually implies new season/ep.
        if (details.status === "Ended" || details.status === "Canceled") {
             // double check next_episode_to_air just in case
             if (!details.next_episode_to_air) return;
        }

        let notificationMessage = null;
        let notificationTitle = "Premiere Alert!";

        const nextEp = details.next_episode_to_air;
        if (nextEp && nextEp.air_date === today) {
            if (nextEp.episode_number === 1) {
                notificationMessage = `New Season ${nextEp.season_number} of ${details.name} starts today!`;
            }
        }

        if (notificationMessage) {
            const userIds = show.userIds;
            const newNotifications = [];

            // Check duplicates for each user
            for (const userId of userIds) {
                const exists = await notificationCollection.findOne({
                    userId,
                    type: "premiere",
                    "data.mediaId": tvId,
                    message: notificationMessage // Dedup exact message for today
                });

                if (!exists) {
                    newNotifications.push({
                        userId, // String format
                        type: "premiere",
                        title: notificationTitle,
                        message: notificationMessage,
                        data: {
                            mediaId: tvId,
                            mediaType: "tv",
                        },
                        isRead: false,
                        createdAt: new Date(),
                    });
                }
            }

            if (newNotifications.length > 0) {
                await notificationCollection.insertMany(newNotifications);

                // Broadcast
                newNotifications.forEach((n) => {
                    broadcastToUser(n.userId, "notification:new", n);
                });
                console.log(`Sent premiere alert for ${details.name} to ${newNotifications.length} users.`);
            }
        }
    });

    console.log("Premiere Alert check complete.");
  } catch (err) {
    console.error("Error in checkPremiereAlerts:", err);
  }
};

const initCronJobs = (watchlistCollection, notificationCollection, broadcastToUser) => {
  // Schedule to run every day at 12:00 PM UTC
  cron.schedule("0 12 * * *", () => {
    checkPremiereAlerts(watchlistCollection, notificationCollection, broadcastToUser);
  });

  console.log("Cron jobs initialized: Premiere Alerts scheduled for 12:00 PM daily.");
};

module.exports = {
    initCronJobs,
    checkPremiereAlerts
};
