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
const compression = require("compression");
const morgan = require("morgan");

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
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
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

async function connectToDb() {
  try {
    await client.connect();
    const db = client.db("scenestackDB");
    watchlistCollection = db.collection("watchlist");
    usersCollection = db.collection("users");
    console.log("Successfully connected to MongoDB.");

    // Create indexes
    await watchlistCollection.createIndex({ userId: 1, id: 1 }, { unique: true });
    await usersCollection.createIndex({ email: 1 }, { unique: true });
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
  watchlistRoutes(watchlistCollection, broadcastToUser, client)(req, res, next);
});

// --- TMDB Proxy Routes ---
app.use("/api/tmdb", tmdbRoutes);



// --- Catch-all for SPA ---
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
});

// --- Global Error Handler (must be last) ---
app.use(errorHandler);

// --- Start Server ---
connectToDb().then(() => {
  server.listen(port, () => {
    console.log(`Scene Stack server running on port ${port}`);
    console.log(`Socket.IO enabled for real-time sync`);
  });
});
