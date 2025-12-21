const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const { validate } = require("../middleware/validate");
const { watchlistItemSchema, watchlistImportSchema } = require("../validation/schemas");

const router = express.Router();

const computeWatchlistStatus = (item) => {
    if (item.media_type === "movie") {
        return item.watched ? "watched" : "watchlist";
    }
    const watchedCount = Object.values(item.watchedEpisodes || {})
        .reduce((acc, eps) => acc + (Array.isArray(eps) ? eps.length : 0), 0);
    if (watchedCount === 0) return "watchlist";
    if (watchedCount >= item.number_of_episodes) return "watched";
    return "watching";
};

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
            const watchlistStatus = computeWatchlistStatus(itemWithoutId);
            const itemWithUser = { ...itemWithoutId, userId: req.userId, watchlistStatus };

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
                const itemsWithUser = items.map((item) => ({
                    ...item,
                    userId: req.userId,
                    watchlistStatus: computeWatchlistStatus(item)
                }));
                await watchlistCollection.insertMany(itemsWithUser);
            }

            broadcastToUser(req.userId, "watchlist:sync", { trigger: "import" });
            res.status(200).json({ message: `Import successful. ${items.length} items imported.` });
        })
    );

    // GET /api/watchlist/by-status/:status - Paginated items by status
    router.get(
        "/by-status/:status",
        authMiddleware,
        asyncHandler(async (req, res) => {
            const { status } = req.params;
            const validStatuses = ["watchlist", "watching", "watched"];
            if (!validStatuses.includes(status)) {
                throw new AppError("Invalid status. Must be: watchlist, watching, or watched", 400);
            }

            const page = Math.max(1, parseInt(req.query.page, 10) || 1);
            const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
            const skip = (page - 1) * limit;

            const query = { userId: req.userId, watchlistStatus: status };

            const [items, totalCount] = await Promise.all([
                watchlistCollection
                    .find(query)
                    .sort({ _id: -1 })
                    .skip(skip)
                    .limit(limit + 1)
                    .toArray(),
                watchlistCollection.countDocuments(query)
            ]);

            const hasMore = items.length > limit;
            if (hasMore) items.pop();

            res.json({ items, hasMore, page, totalCount });
        })
    );

    return router;
};
