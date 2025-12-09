const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { authMiddleware, JWT_SECRET } = require("./middleware/authMiddleware");
const authRoutes = require("./routes/authRoutes");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3001;

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

  // Join user-specific room for targeted broadcasts
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: { message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Middleware ---
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

// Disable caching for API routes
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.use(express.static(path.join(__dirname, "../../client/dist")));

// --- MongoDB Connection ---
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("ERROR: MONGO_URI environment variable not set.");
  process.exit(1);
}

const client = new MongoClient(uri, {
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
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
}

// --- Auth Routes ---
app.use("/api/auth", authLimiter, (req, res, next) => {
  req.usersCollection = usersCollection;
  authRoutes(usersCollection)(req, res, next);
});

// --- Protected Watchlist Endpoints ---

// GET /api/watchlist
app.get("/api/watchlist", authMiddleware, async (req, res) => {
  try {
    const items = await watchlistCollection
      .find({ userId: req.userId })
      .sort({ _id: -1 })
      .toArray();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to retrieve watchlist items." });
  }
});

// GET /api/watchlist/:id
app.get("/api/watchlist/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }
    const item = await watchlistCollection.findOne({ id, userId: req.userId });
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ message: "Item not found." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to retrieve watchlist item." });
  }
});

// PUT /api/watchlist
app.put("/api/watchlist", authMiddleware, async (req, res) => {
  try {
    const item = req.body;
    if (!item || typeof item.id !== "number") {
      return res.status(400).json({ message: "Invalid item data." });
    }

    const { _id, ...itemWithoutId } = item;
    const itemWithUser = { ...itemWithoutId, userId: req.userId };

    await watchlistCollection.replaceOne(
      { id: item.id, userId: req.userId },
      itemWithUser,
      { upsert: true }
    );

    // Broadcast update to all user's devices
    broadcastToUser(req.userId, "watchlist:update", itemWithUser);

    res.status(200).json(itemWithUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save watchlist item." });
  }
});

// DELETE /api/watchlist/:id
app.delete("/api/watchlist/:id", authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }
    const result = await watchlistCollection.deleteOne({ id, userId: req.userId });
    if (result.deletedCount === 1) {
      // Broadcast delete to all user's devices
      broadcastToUser(req.userId, "watchlist:delete", { id });
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Item not found." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete watchlist item." });
  }
});

// POST /api/watchlist/import
app.post("/api/watchlist/import", authMiddleware, async (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "Request body must be an array." });
    }

    // Delete only this user's items
    await watchlistCollection.deleteMany({ userId: req.userId });

    if (items.length > 0) {
      const itemsWithUser = items.map(item => ({ ...item, userId: req.userId }));
      await watchlistCollection.insertMany(itemsWithUser);
    }

    // Broadcast full sync trigger to all user's devices
    broadcastToUser(req.userId, "watchlist:sync", { trigger: "import" });

    res.status(200).json({ message: `Import successful. ${items.length} items imported.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to import watchlist." });
  }
});

// GET /api/stats - Get database storage stats
app.get("/api/stats", authMiddleware, async (req, res) => {
  try {
    const userItemCount = await watchlistCollection.countDocuments({ userId: req.userId });
    const totalDocuments = await watchlistCollection.countDocuments();
    const db = client.db("scenestackDB");
    let dbStats = null;
    try {
      dbStats = await db.stats();
    } catch (statsErr) {
      console.log("Could not get database stats:", statsErr.message);
    }

    res.json({
      user: {
        itemCount: userItemCount,
      },
      collection: {
        totalDocuments: totalDocuments,
        storageSize: dbStats?.storageSize || 0,
        avgObjSize: dbStats?.avgObjSize || 0,
      },
      database: {
        name: dbStats?.db || "scenestackDB",
        dataSize: dbStats?.dataSize || 0,
      }
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Failed to retrieve database stats." });
  }
});

// --- Catch-all for SPA ---
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
});

// --- Start Server ---
connectToDb().then(() => {
  server.listen(port, () => {
    console.log(`Scene Stack server running on port ${port}`);
    console.log(`Socket.IO enabled for real-time sync`);
  });
});

