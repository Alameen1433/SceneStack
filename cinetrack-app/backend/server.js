// backend/server.js
// A simple Node.js Express backend to connect CineTrack to MongoDB.
//
// --- How to Run ---
// 1. In your terminal, navigate to this `backend` directory.
// 2. Install dependencies: `npm install`
// 3. Create a file named `.env` in this directory.
// 4. In the `.env` file, add your MongoDB connection string:
//    MONGO_URI="your_mongodb_connection_string_here"
// 5. Run the server: `npm start`
//
// The server will start on port 3001 by default.

require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Middleware to parse JSON bodies

// --- MongoDB Connection ---
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("ERROR: MONGO_URI environment variable not set.");
  console.error(
    "Please create a .env file in the `backend` directory with your MongoDB connection string."
  );
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

async function connectToDb() {
  try {
    await client.connect();
    const db = client.db("cinetrackDB"); // You can change this database name if you like
    watchlistCollection = db.collection("watchlist");
    console.log("Successfully connected to MongoDB.");

    // Create an index on the 'id' field for faster lookups and to ensure uniqueness
    await watchlistCollection.createIndex({ id: 1 }, { unique: true });
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
}

// --- API Endpoints ---

// GET /api/watchlist - Get all watchlist items
app.get("/api/watchlist", async (req, res) => {
  try {
    const items = await watchlistCollection
      .find({})
      .sort({ _id: -1 })
      .toArray(); // Sort by insertion order
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to retrieve watchlist items." });
  }
});

// GET /api/watchlist/:id - Get a single watchlist item by its TMDB ID
app.get("/api/watchlist/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ message: "Invalid ID format. ID must be a number." });
    }
    const item = await watchlistCollection.findOne({ id: id });
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ message: "Item not found in watchlist." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to retrieve watchlist item." });
  }
});

// PUT /api/watchlist - Add or update a watchlist item
app.put("/api/watchlist", async (req, res) => {
  try {
    const item = req.body;
    if (!item || typeof item.id !== "number") {
      return res
        .status(400)
        .json({
          message: "Invalid item data. 'id' is required and must be a number.",
        });
    }

    // Use replaceOne with upsert to either insert a new document or update an existing one.
    const result = await watchlistCollection.replaceOne({ id: item.id }, item, {
      upsert: true,
    });
    res.status(200).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save watchlist item." });
  }
});

// DELETE /api/watchlist/:id - Delete a watchlist item
app.delete("/api/watchlist/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ message: "Invalid ID format. ID must be a number." });
    }
    const result = await watchlistCollection.deleteOne({ id: id });
    if (result.deletedCount === 1) {
      res.status(204).send(); // 204 No Content for successful deletion
    } else {
      res.status(404).json({ message: "Item not found in watchlist." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete watchlist item." });
  }
});

// POST /api/watchlist/import - Clear and bulk import watchlist
app.post("/api/watchlist/import", async (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items)) {
      return res
        .status(400)
        .json({ message: "Request body must be an array of watchlist items." });
    }

    await watchlistCollection.deleteMany({});

    if (items.length > 0) {
      // Ensure all items have a numeric id
      for (const item of items) {
        if (typeof item.id !== "number") {
          return res
            .status(400)
            .json({ message: "All imported items must have a numeric id." });
        }
      }
      await watchlistCollection.insertMany(items);
    }
    res
      .status(200)
      .json({ message: `Import successful. ${items.length} items imported.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to import watchlist." });
  }
});

// --- Start Server ---
connectToDb().then(() => {
  app.listen(port, () => {
    console.log(`CineTrack server listening on http://localhost:${port}`);
  });
});
