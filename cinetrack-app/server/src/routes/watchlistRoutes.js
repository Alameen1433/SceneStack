const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const { validate } = require("../middleware/validate");
const { watchlistItemSchema, watchlistImportSchema } = require("../validation/schemas");

const router = express.Router();

module.exports = (watchlistCollection, broadcastToUser, client) => {
    // GET /api/watchlist
    router.get(
        "/",
        authMiddleware,
        asyncHandler(async (req, res) => {
            const items = await watchlistCollection
                .find({ userId: req.userId })
                .sort({ _id: -1 })
                .toArray();
            res.json(items);
        })
    );

    // GET /api/stats
    router.get(
        "/stats",
        authMiddleware,
        asyncHandler(async (req, res) => {
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
                user: { itemCount: userItemCount },
                collection: {
                    totalDocuments,
                    storageSize: dbStats?.storageSize || 0,
                    avgObjSize: dbStats?.avgObjSize || 0,
                },
                database: {
                    name: dbStats?.db || "scenestackDB",
                    dataSize: dbStats?.dataSize || 0,
                },
            });
        })
    );

    // GET /api/watchlist/:id
    router.get(
        "/:id",
        authMiddleware,
        asyncHandler(async (req, res) => {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                throw new AppError("Invalid ID format.", 400);
            }

            const item = await watchlistCollection.findOne({ id, userId: req.userId });
            if (!item) {
                throw new AppError("Item not found.", 404);
            }
            res.json(item);
        })
    );

    // PUT /api/watchlist
    router.put(
        "/",
        authMiddleware,
        validate(watchlistItemSchema),
        asyncHandler(async (req, res) => {
            const item = req.body;

            const { _id, ...itemWithoutId } = item;
            const itemWithUser = { ...itemWithoutId, userId: req.userId };

            await watchlistCollection.replaceOne(
                { id: item.id, userId: req.userId },
                itemWithUser,
                { upsert: true }
            );

            broadcastToUser(req.userId, "watchlist:update", itemWithUser);
            res.status(200).json(itemWithUser);
        })
    );

    // DELETE /api/watchlist/:id
    router.delete(
        "/:id",
        authMiddleware,
        asyncHandler(async (req, res) => {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                throw new AppError("Invalid ID format.", 400);
            }

            const result = await watchlistCollection.deleteOne({ id, userId: req.userId });
            if (result.deletedCount !== 1) {
                throw new AppError("Item not found.", 404);
            }

            broadcastToUser(req.userId, "watchlist:delete", { id });
            res.status(204).send();
        })
    );

    // DELETE /api/watchlist (Wipe all data)
    router.delete(
        "/",
        authMiddleware,
        asyncHandler(async (req, res) => {
            await watchlistCollection.deleteMany({ userId: req.userId });
            broadcastToUser(req.userId, "watchlist:sync", { trigger: "wipe" });
            res.status(204).send();
        })
    );

    // POST /api/watchlist/import
    router.post(
        "/import",
        authMiddleware,
        validate(watchlistImportSchema),
        asyncHandler(async (req, res) => {
            const items = req.body;

            await watchlistCollection.deleteMany({ userId: req.userId });

            if (items.length > 0) {
                const itemsWithUser = items.map((item) => ({ ...item, userId: req.userId }));
                await watchlistCollection.insertMany(itemsWithUser);
            }

            broadcastToUser(req.userId, "watchlist:sync", { trigger: "import" });
            res.status(200).json({ message: `Import successful. ${items.length} items imported.` });
        })
    );



    return router;
};
