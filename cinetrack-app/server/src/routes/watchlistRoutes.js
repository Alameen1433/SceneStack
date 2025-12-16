const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const { validate } = require("../middleware/validate");
const { watchlistItemSchema, watchlistImportSchema } = require("../validation/schemas");
const { scheduler } = require("../config");

const { ObjectId } = require("mongodb");

const router = express.Router();

module.exports = (watchlistCollection, notificationsCollection, broadcastToUser, client) => {
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

    // --- Notification Endpoints (must be before /:id) ---

    // GET /api/watchlist/notifications
    router.get(
        "/notifications",
        authMiddleware,
        asyncHandler(async (req, res) => {
            const notifications = await notificationsCollection
                .find({ userId: new ObjectId(req.userId) })
                .sort({ createdAt: -1 })
                .limit(50)
                .toArray();

            const unreadCount = await notificationsCollection.countDocuments({
                userId: new ObjectId(req.userId),
                read: false,
            });

            res.json({ notifications, unreadCount });
        })
    );

    // PATCH /api/watchlist/notifications/:id/read
    router.patch(
        "/notifications/:id/read",
        authMiddleware,
        asyncHandler(async (req, res) => {
            const result = await notificationsCollection.updateOne(
                { _id: new ObjectId(req.params.id), userId: new ObjectId(req.userId) },
                { $set: { read: true, readAt: new Date() } }
            );

            if (result.matchedCount === 0) {
                throw new AppError("Notification not found", 404);
            }

            broadcastToUser(req.userId, "notification:read", { id: req.params.id });
            res.json({ success: true });
        })
    );

    // PATCH /api/watchlist/notifications/read-all
    router.patch(
        "/notifications/read-all",
        authMiddleware,
        asyncHandler(async (req, res) => {
            await notificationsCollection.updateMany(
                { userId: new ObjectId(req.userId), read: false },
                { $set: { read: true, readAt: new Date() } }
            );
            broadcastToUser(req.userId, "notification:read-all", {});
            res.json({ success: true });
        })
    );

    // DELETE /api/watchlist/notifications/:id
    router.delete(
        "/notifications/:id",
        authMiddleware,
        asyncHandler(async (req, res) => {
            const result = await notificationsCollection.deleteOne({
                _id: new ObjectId(req.params.id),
                userId: new ObjectId(req.userId),
            });

            if (result.deletedCount === 0) {
                throw new AppError("Notification not found", 404);
            }

            broadcastToUser(req.userId, "notification:delete", { id: req.params.id });
            res.json({ success: true });
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

            if (item.media_type === "tv") {
                const status = item.status;
                const isEnded = status === "Ended" || status === "Canceled";

                if (!isEnded) {
                    const nextEp = item.next_episode_to_air;
                    if (nextEp?.air_date) {
                        const airDate = new Date(nextEp.air_date);
                        if (airDate > new Date()) {
                            await scheduler.scheduleEpisode(item.id, nextEp.air_date, {
                                name: item.name || "",
                                nextEp: `S${nextEp.season_number}E${nextEp.episode_number}`,
                            });
                        }
                    } else {
                        await scheduler.addToTBA(item.id);
                    }
                }
            }

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

                for (const item of items) {
                    if (item.media_type === "tv") {
                        const status = item.status;
                        const isEnded = status === "Ended" || status === "Canceled";

                        if (!isEnded) {
                            const nextEp = item.next_episode_to_air;
                            if (nextEp?.air_date) {
                                const airDate = new Date(nextEp.air_date);
                                if (airDate > new Date()) {
                                    await scheduler.scheduleEpisode(item.id, nextEp.air_date, {
                                        name: item.name || "",
                                        nextEp: `S${nextEp.season_number}E${nextEp.episode_number}`,
                                    });
                                }
                            } else {
                                await scheduler.addToTBA(item.id);
                            }
                        }
                    }
                }
            }

            broadcastToUser(req.userId, "watchlist:sync", { trigger: "import" });
            res.status(200).json({ message: `Import successful. ${items.length} items imported.` });
        })
    );

    return router;
};
