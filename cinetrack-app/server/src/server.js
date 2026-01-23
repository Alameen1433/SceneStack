const config = require("./config");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const morgan = require("morgan");

const { authMiddleware, JWT_SECRET } = require("./middleware/authMiddleware");
const { errorHandler } = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");
const tmdbRoutes = require("./routes/tmdbRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const { initCronJobs } = require("./services/cronService");

const app = express();
const server = http.createServer(app);
const port = config.port;

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

const parseCookies = (cookieHeader) => {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name) cookies[name] = rest.join("=");
  });
  return cookies;
};

io.use((socket, next) => {
  const cookies = parseCookies(socket.handshake.headers.cookie);
  const token = cookies["scenestack_token"] || socket.handshake.auth.token;

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
        scriptSrc: ["'self'"],
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
app.use(cookieParser());

// Disable caching for API routes (including Cloudflare edge)
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, private");
  res.set("CDN-Cache-Control", "no-store");
  res.set("Cloudflare-CDN-Cache-Control", "no-store");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

app.use(express.static(path.join(__dirname, "../../client/dist")));

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
let notificationCollection;
let demoUsersCollection;
let demoWatchlistCollection;

async function connectToDb() {
  try {
    await client.connect();
    const db = client.db("scenestackDB");
    watchlistCollection = db.collection("watchlist");
    usersCollection = db.collection("users");
    notificationCollection = db.collection("notifications");
    demoUsersCollection = db.collection("demoUsers");
    demoWatchlistCollection = db.collection("demoWatchlist");
    console.log("Successfully connected to MongoDB.");

    // Create indexes for production collections
    await watchlistCollection.createIndex({ userId: 1, id: 1 }, { unique: true });
    await watchlistCollection.createIndex({ userId: 1, watchlistStatus: 1 });
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await notificationCollection.createIndex({ userId: 1, createdAt: -1 });
    await notificationCollection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 30 * 24 * 60 * 60 } // 30 days TTL
    );

    // Create indexes for demo collections with TTL for auto-cleanup
    await demoUsersCollection.createIndex({ email: 1 }, { unique: true });
    await demoUsersCollection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: config.demoTtlSeconds }
    );
    await demoWatchlistCollection.createIndex({ userId: 1, id: 1 }, { unique: true });
    await demoWatchlistCollection.createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: config.demoTtlSeconds }
    );
    console.log(`Demo TTL indexes created (${config.demoTtlSeconds}s)`);
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
  authRoutes(usersCollection, demoUsersCollection)(req, res, next);
});

// --- Watchlist Routes ---
app.use("/api/watchlist", (req, res, next) => {
  watchlistRoutes(
    watchlistCollection,
    demoWatchlistCollection,
    broadcastToUser,
    client,
    usersCollection,
    demoUsersCollection,
    notificationCollection
  )(req, res, next);
});

// --- Notification Routes ---
app.use("/api/notifications", (req, res, next) => {
  notificationRoutes(notificationCollection)(req, res, next);
});

// --- TMDB Proxy Routes ---
app.use("/api/tmdb", tmdbRoutes);

// --- Catch-all for SPA ---
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
});

// --- Global Error Handler ---
app.use(errorHandler);

// --- Start Server ---
connectToDb().then(() => {
  server.listen(port, () => {
    console.log(`Scene Stack server running on port ${port}`);
    console.log(`Socket.IO enabled for real-time sync`);

    // Initialize Cron Jobs
    initCronJobs(watchlistCollection, notificationCollection, broadcastToUser);
  });
});
