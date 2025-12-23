const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const { validate } = require("../middleware/validate");
const { watchlistItemSchema, watchlistImportSchema } = require("../validation/schemas");
const { cache } = require("../config");
const { ObjectId } = require("mongodb");

const router = express.Router();

const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_API_TOKEN = process.env.TMDB_API_READ_ACCESS_TOKEN;
const RECOMMENDATIONS_TTL = 12 * 60 * 60; // 12 hours

const fetchFromTMDB = async (endpoint) => {
    const url = `${TMDB_API_BASE_URL}/${endpoint}`;
    const response = await fetch(url, {
        method: "GET",
        headers: {
            accept: "application/json",
            Authorization: `Bearer ${TMDB_API_TOKEN}`,
        },
    });
    if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
    }
    return response.json();
};

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

module.exports = (watchlistCollection, demoWatchlistCollection, broadcastToUser, client, usersCollection, demoUsersCollection) => {
    const getWatchlistCollection = async (userId) => {
        const demoUser = await demoUsersCollection.findOne({ _id: new ObjectId(userId) });
        if (demoUser) {
            return { collection: demoWatchlistCollection, isDemo: true };
        }
        return { collection: watchlistCollection, isDemo: false };
    };

    // GET /api/watchlist
    router.get(
        "/",
        authMiddleware,
        asyncHandler(async (req, res) => {
            const { collection } = await getWatchlistCollection(req.userId);
            const items = await collection
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
            const { collection, isDemo } = await getWatchlistCollection(req.userId);
            const userItemCount = await collection.countDocuments({ userId: req.userId });
            const totalDocuments = await collection.countDocuments();
            const db = client.db("scenestackDB");

            let dbStats = null;
            try {
                dbStats = await db.stats();
            } catch (statsErr) {
                console.log("Could not get database stats:", statsErr.message);
            }

            res.json({
                user: { itemCount: userItemCount, isDemo },
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

    // GET /api/watchlist/recommendations - User-specific recommendations cached for 12 hours
    router.get(
        "/recommendations",
        authMiddleware,
        asyncHandler(async (req, res) => {
            const { collection } = await getWatchlistCollection(req.userId);
            const refresh = req.query.refresh === "true";
            const cacheKey = `user:recommendations:${req.userId}`;

            if (!refresh) {
                const cached = await cache.get(cacheKey);
                if (cached) {
                    res.set("X-Cache", "HIT");
                    return res.json(cached);
                }
            }

            const watchlist = await collection
                .find({ userId: req.userId })
                .toArray();

            if (watchlist.length === 0) {
                return res.json({ recommendations: [] });
            }

            const watchlistIds = new Set(watchlist.map((item) => item.id));
            const shuffled = [...watchlist].sort(() => 0.5 - Math.random());
            const seedItems = shuffled.slice(0, 5);

            const recPromises = seedItems.map(async (item) => {
                try {
                    const response = await fetchFromTMDB(
                        `${item.media_type}/${item.id}/recommendations`
                    );
                    return response.results.map((r) => ({
                        ...r,
                        media_type: item.media_type,
                    }));
                } catch {
                    return [];
                }
            });

            const recArrays = await Promise.all(recPromises);
            const flatRecs = recArrays.flat();

            const uniqueRecsMap = new Map();
            flatRecs.forEach((rec) => {
                if (!watchlistIds.has(rec.id) && rec.poster_path) {
                    uniqueRecsMap.set(rec.id, rec);
                }
            });

            const recommendations = Array.from(uniqueRecsMap.values());
            const data = { recommendations };

            await cache.set(cacheKey, data, RECOMMENDATIONS_TTL);
            res.set("X-Cache", "MISS");
            res.json(data);
        })
    );

    // GET /api/watchlist/:id
    router.get(
        "/:id",
        authMiddleware,
        asyncHandler(async (req, res) => {
            const { collection } = await getWatchlistCollection(req.userId);
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                throw new AppError("Invalid ID format.", 400);
            }

            const item = await collection.findOne({ id, userId: req.userId });
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
            const { collection } = await getWatchlistCollection(req.userId);
            const item = req.body;

            const { _id, ...itemWithoutId } = item;
            const watchlistStatus = computeWatchlistStatus(itemWithoutId);
            const itemWithUser = {
                ...itemWithoutId,
                userId: req.userId,
                watchlistStatus,
                createdAt: new Date()
            };

            await collection.replaceOne(
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
            const { collection } = await getWatchlistCollection(req.userId);
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                throw new AppError("Invalid ID format.", 400);
            }

            const result = await collection.deleteOne({ id, userId: req.userId });
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
            const { collection } = await getWatchlistCollection(req.userId);
            await collection.deleteMany({ userId: req.userId });
            broadcastToUser(req.userId, "watchlist:sync", { trigger: "wipe" });
            res.status(204).send();
        })
    );

    // POST /api/watchlist/import (blocked for demo users)
    router.post(
        "/import",
        authMiddleware,
        asyncHandler(async (req, res, next) => {
            const { isDemo } = await getWatchlistCollection(req.userId);
            if (isDemo) {
                throw new AppError("Demo accounts cannot import watchlists", 403);
            }
            next();
        }),
        validate(watchlistImportSchema),
        asyncHandler(async (req, res) => {
            const items = req.body;

            await watchlistCollection.deleteMany({ userId: req.userId });

            if (items.length > 0) {
                const itemsWithUser = items.map((item) => ({
                    ...item,
                    userId: req.userId,
                    watchlistStatus: computeWatchlistStatus(item),
                    createdAt: new Date()
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
            const { collection } = await getWatchlistCollection(req.userId);
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
                collection
                    .find(query)
                    .sort({ _id: -1 })
                    .skip(skip)
                    .limit(limit + 1)
                    .toArray(),
                collection.countDocuments(query)
            ]);

            const hasMore = items.length > limit;
            if (hasMore) items.pop();

            res.json({ items, hasMore, page, totalCount });
        })
    );

    return router;
};
