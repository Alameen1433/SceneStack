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
    await cache.set(cacheKey, details, 86400);
  }
  return details;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const checkPremiereAlerts = async (
  watchlistCollection,
  notificationCollection,
  broadcastToUser
) => {
  console.log("Starting Premiere Alert check...");
  const today = new Date().toISOString().split("T")[0];

  try {
    const pipeline = [
      {
        $match: {
          media_type: "tv",
          watchlistStatus: "watching",
        },
      },
      {
        $group: {
          _id: "$id",
          title: { $first: "$name" },
        },
      },
    ];

    const showCursor = watchlistCollection.aggregate(pipeline);
    
    let showsProcessed = 0;
    let alertsSent = 0;

    for await (const show of showCursor) {
      showsProcessed++;
      const tvId = show._id;

      try {
        const details = await getCachedTVDetails(tvId);

        if (!details) continue;

        if (details.status === "Ended" || details.status === "Canceled") {
          if (!details.next_episode_to_air) continue;
        }

        const nextEp = details.next_episode_to_air;
        let notificationMessage = null;
        let notificationTitle = "Premiere Alert!";

        if (nextEp && nextEp.air_date === today) {
          if (nextEp.episode_number === 1) {
            notificationMessage = `New Season ${nextEp.season_number} of ${details.name} starts today!`;
          }
        }

        if (notificationMessage) {
          const subscriberCursor = watchlistCollection.find({
            id: tvId,
            watchlistStatus: { $in: ["watching", "watched"] },
          });

          let batch = [];
          const BATCH_SIZE = 500;

          for await (const subscriber of subscriberCursor) {
            const userId = subscriber.userId;

            const exists = await notificationCollection.findOne({
               userId,
               type: "premiere",
               "data.mediaId": tvId,
               message: notificationMessage,
            });

            if (!exists) {
              batch.push({
                userId,
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

            if (batch.length >= BATCH_SIZE) {
               await notificationCollection.insertMany(batch);
               batch.forEach(n => broadcastToUser(n.userId, "notification:new", n));
               alertsSent += batch.length;
               batch = [];
            }
          }

          if (batch.length > 0) {
            await notificationCollection.insertMany(batch);
            batch.forEach(n => broadcastToUser(n.userId, "notification:new", n));
            alertsSent += batch.length;
            batch = [];
          }
          
          console.log(`Sent premiere alert for ${details.name} (Season ${nextEp.season_number}).`);
        }
      } catch (innerErr) {
        console.error(`Error processing show ${show.title} (${tvId}):`, innerErr.message);
      }
    }

    console.log(`Premiere Alert check complete. Processed ${showsProcessed} shows. Sent ${alertsSent} alerts.`);
  } catch (err) {
    console.error("Critical Error in checkPremiereAlerts:", err);
  }
};

const initCronJobs = (watchlistCollection, notificationCollection, broadcastToUser) => {
  console.log("Running startup Premiere Alert check...");
  checkPremiereAlerts(watchlistCollection, notificationCollection, broadcastToUser);

  // Schedule to run 3 times daily - 8 AM, 2 PM, 8 PM UTC
  cron.schedule("0 8,14,20 * * *", () => {
    checkPremiereAlerts(watchlistCollection, notificationCollection, broadcastToUser);
  });

  console.log("Cron jobs initialized: Premiere Alerts scheduled for 8 AM, 2 PM, 8 PM UTC daily.");
};

module.exports = {
  initCronJobs,
  checkPremiereAlerts,
};
