require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 3001;

// --- Middleware ---
app.use(
  cors({
    origin: true, // Allow all origins (dynamically reflects the request origin)
    credentials: true, // Allow cookies and authorization headers
  })
); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Middleware to parse JSON bodies

app.use(express.static(path.join(__dirname, "../../client/dist")));

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
    const db = client.db("scenestackDB");
    watchlistCollection = db.collection("watchlist");
    console.log("Successfully connected to MongoDB.");

    // Create an index on the 'id'
    await watchlistCollection.createIndex({ id: 1 }, { unique: true });
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
}

// --- API Endpoints ---

// GET /api/watchlist
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

// GET /api/watchlist/:id 
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

// PUT /api/watchlist 
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

// DELETE 
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

// POST /api/watchlist/import
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

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
});

connectToDb().then(() => {
  app.listen(port, () => {
    console.log(`Scene Stack server up and running on port ${port}`);
  });
});
