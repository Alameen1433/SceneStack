const config = require("./config");
const express = require("express");
const http = require("http");
const fs = require("fs");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const cron = require("node-cron");

const { authMiddleware, JWT_SECRET } = require("./middleware/authMiddleware");
const { errorHandler } = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");
const tmdbRoutes = require("./routes/tmdbRoutes");

const app = express();
const server = http.createServer(app);
const port = config.port;

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication required"));
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.userId;
  socket.join(`user:${userId}`);
  console.log(`User ${userId} connected via Socket.IO`);

  socket.on("disconnect", () => {
    console.log(`User ${userId} disconnected`);
  });
});

// Helper to broadcast watchlist changes to all user's devices
const broadcastToUser = (userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Middleware ---
app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.themoviedb.org", "wss:", "ws:"],
        imgSrc: ["'self'", "https://image.tmdb.org", "data:", "blob:"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
      },
    },
  })
);
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

// Disable caching for API routes
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

app.use(express.static(path.join(__dirname, "../../client/dist"), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".js")) {
      res.setHeader("Content-Type", "application/javascript");
    } else if (filePath.endsWith(".css")) {
      res.setHeader("Content-Type", "text/css");
    } else if (filePath.endsWith(".html")) {
      res.setHeader("Content-Type", "text/html");
    }
  }
}));

// --- MongoDB Connection ---
const client = new MongoClient(config.mongo.uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let watchlistCollection;
let usersCollection;
let notificationsCollection;

async function connectToDb() {
  try {
    await client.connect();
    const db = client.db("scenestackDB");
    watchlistCollection = db.collection("watchlist");
    usersCollection = db.collection("users");
    notificationsCollection = db.collection("notifications");
    console.log("Successfully connected to MongoDB.");

    // Create indexes
    await watchlistCollection.createIndex({ userId: 1, id: 1 }, { unique: true });
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await notificationsCollection.createIndex({ userId: 1, createdAt: -1 });
    await notificationsCollection.createIndex(
      { readAt: 1 },
      { expireAfterSeconds: 604800, partialFilterExpression: { read: true } }
    );
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }
}

// MongoDB connection event handlers
client.on("error", (err) => {
  console.error("MongoDB connection error:", err.message);
});

client.on("close", () => {
  console.log("MongoDB connection closed");
});

client.on("timeout", () => {
  console.error("MongoDB connection timeout");
});

// --- Auth Routes ---
app.use("/api/auth", authLimiter, (req, res, next) => {
  req.usersCollection = usersCollection;
  authRoutes(usersCollection)(req, res, next);
});

// --- Watchlist Routes ---
app.use("/api/watchlist", (req, res, next) => {
  watchlistRoutes(watchlistCollection, notificationsCollection, broadcastToUser, client)(req, res, next);
});

// --- TMDB Proxy Routes ---
app.use("/api/tmdb", tmdbRoutes);

// --- Testing ---
if (process.env.NODE_ENV !== "production") {
  const { authMiddleware } = require("./middleware/authMiddleware");
  const { ObjectId } = require("mongodb");

  // Create a test notification
  app.post("/api/test/notification", authMiddleware, async (req, res) => {
    try {
      const notification = {
        userId: new ObjectId(req.userId),
        type: "new_episode",
        mediaId: 1399,
        title: "Test Show",
        message: "S1E1 is now available!",
        read: false,
        createdAt: new Date(),
        readAt: null,
      };
      await notificationsCollection.insertOne(notification);
      io.to(`user:${req.userId}`).emit("notification:new", notification);
      res.json({ success: true, notification });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // View scheduled shows in Redis
  app.get("/api/test/schedule", async (req, res) => {
    try {
      const scheduled = await config.scheduler.getAllScheduled();
      const due = await config.scheduler.getDueShows();
      const tba = await config.scheduler.getTBAShows();
      res.json({ scheduled, due, tba, redisConnected: config.scheduler.isConnected() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

// --- Catch-all for SPA ---
app.get("*", (req, res, next) => {
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|map)$/)) {
    return next();
  }
  res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
});

// --- Global Error Handler ---
app.use(errorHandler);

connectToDb().then(() => {
  const distPath = path.join(__dirname, "../../client/dist");
  if (!fs.existsSync(distPath)) {
    console.error(`[WARN] Client dist folder not found at: ${distPath}`);
  } else {
    const files = fs.readdirSync(distPath);
    console.log(`[Static] Serving ${files.length} files from client/dist`);
  }

  server.listen(port, () => {
    console.log(`Scene Stack server running on port ${port}`);
    console.log(`Socket.IO enabled for real-time sync`);
  });

  // --- Notification Cron Processor ---
  const processScheduledNotifications = async () => {
    try {
      const dueShows = await config.scheduler.getDueShows();
      if (dueShows.length === 0) return;

      console.log(`[Cron] Processing ${dueShows.length} due notifications`);

      for (const member of dueShows) {
        const showId = parseInt(member.split(":")[1], 10);
        const meta = await config.scheduler.getShowMeta(showId);

        if (!meta) {
          await config.scheduler.removeFromSchedule(member);
          continue;
        }

        const usersWithShow = await watchlistCollection
          .find({ id: showId, media_type: "tv" })
          .toArray();

        for (const userItem of usersWithShow) {
          const notification = {
            userId: userItem.userId,
            type: "new_episode",
            mediaId: showId,
            title: meta.name || "TV Show",
            message: `${meta.nextEp || "New episode"} is now available!`,
            read: false,
            createdAt: new Date(),
            readAt: null,
          };

          await notificationsCollection.insertOne(notification);
          io.to(`user:${userItem.userId}`).emit("notification:new", notification);
        }

        await config.scheduler.removeFromSchedule(member);

        // Reschedule: fetch fresh data from TMDB for next episode
        const tmdbToken = process.env.TMDB_API_READ_ACCESS_TOKEN;
        if (tmdbToken) {
          try {
            const response = await fetch(
              `https://api.themoviedb.org/3/tv/${showId}`,
              { headers: { Authorization: `Bearer ${tmdbToken}` } }
            );
            const show = await response.json();

            if (show.status === "Ended" || show.status === "Canceled") {
              continue;
            }

            if (show.next_episode_to_air?.air_date) {
              const airDate = new Date(show.next_episode_to_air.air_date);
              if (airDate > new Date()) {
                await config.scheduler.scheduleEpisode(showId, show.next_episode_to_air.air_date, {
                  name: show.name,
                  nextEp: `S${show.next_episode_to_air.season_number}E${show.next_episode_to_air.episode_number}`,
                });
              }
            } else {
              await config.scheduler.addToTBA(showId);
            }
          } catch (err) {
            console.error(`[Cron] Failed to reschedule show ${showId}:`, err.message);
          }
        }
      }

      console.log(`[Cron] Finished processing notifications`);
    } catch (err) {
      console.error("[Cron] Error processing notifications:", err.message);
    }
  };

  cron.schedule("0 8,20 * * *", processScheduledNotifications);
  console.log("Notification cron scheduled (8 AM and 8 PM daily)");

  // --- TBA Handling ---
  const processTBAShows = async () => {
    try {
      const tbaShows = await config.scheduler.getTBAShows();
      if (tbaShows.length === 0) return;

      console.log(`[TBA Cron] Checking ${tbaShows.length} shows for air dates`);
      const tmdbToken = process.env.TMDB_API_READ_ACCESS_TOKEN;
      if (!tmdbToken) return;

      for (const showId of tbaShows) {
        try {
          const response = await fetch(
            `https://api.themoviedb.org/3/tv/${showId}`,
            { headers: { Authorization: `Bearer ${tmdbToken}` } }
          );
          const show = await response.json();

          if (show.status === "Ended" || show.status === "Canceled") {
            await config.scheduler.removeFromTBA(showId);
            continue;
          }

          if (show.next_episode_to_air?.air_date) {
            const airDate = new Date(show.next_episode_to_air.air_date);
            if (airDate > new Date()) {
              await config.scheduler.scheduleEpisode(showId, show.next_episode_to_air.air_date, {
                name: show.name,
                nextEp: `S${show.next_episode_to_air.season_number}E${show.next_episode_to_air.episode_number}`,
              });
              await config.scheduler.removeFromTBA(showId);
              console.log(`[TBA Cron] Moved show ${show.name} to main schedule`);
            }
          }
        } catch (err) {
          console.error(`[TBA Cron] Failed to check show ${showId}:`, err.message);
        }
      }

      console.log(`[TBA Cron] Finished checking TBA shows`);
    } catch (err) {
      console.error("[TBA Cron] Error:", err.message);
    }
  };

  cron.schedule("0 3 * * 0", processTBAShows);
  console.log("TBA handler cron scheduled (Sundays at 3 AM)");
});
