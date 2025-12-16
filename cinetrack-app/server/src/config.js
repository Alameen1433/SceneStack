const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const Redis = require("ioredis");

const required = ["MONGO_URI", "JWT_SECRET", "INVITE_CODES"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missing.join(", ")}`);
    console.error("Check your .env file and ensure all required variables are set.");
    process.exit(1);
}

let redis = null;
let redisConnected = false;

if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true,
    });

    redis.on("connect", () => {
        redisConnected = true;
        console.log("Redis connected successfully");
    });

    redis.on("error", (err) => {
        redisConnected = false;
        console.error("Redis connection error:", err.message);
    });

    redis.on("close", () => {
        redisConnected = false;
        console.log("Redis connection closed");
    });

    redis.connect().catch((err) => {
        console.warn("Redis initial connection failed:", err.message);
        console.warn("Cache will be disabled, falling back to direct API calls");
    });
} else {
    console.warn("REDIS_URL not set - caching disabled");
}

const cache = {
    isConnected: () => redisConnected && redis !== null,

    async get(key) {
        if (!this.isConnected()) return null;
        try {
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (err) {
            console.error("Cache get error:", err.message);
            return null;
        }
    },

    async set(key, data, ttlSeconds) {
        if (!this.isConnected()) return;
        try {
            await redis.setex(key, ttlSeconds, JSON.stringify(data));
        } catch (err) {
            console.error("Cache set error:", err.message);
        }
    },

    async setWithLimit(key, data, ttlSeconds, indexKey, limit) {
        if (!this.isConnected()) return;
        try {
            await redis.setex(key, ttlSeconds, JSON.stringify(data));
            await redis.zadd(indexKey, Date.now(), key);
            await redis.expire(indexKey, ttlSeconds * 2);

            const count = await redis.zcard(indexKey);
            if (count > limit) {
                const toEvict = await redis.zrange(indexKey, 0, count - limit - 1);
                if (toEvict.length > 0) {
                    await redis.del(...toEvict);
                    await redis.zrem(indexKey, ...toEvict);
                }
            }
        } catch (err) {
            console.error("Cache setWithLimit error:", err.message);
        }
    },
};

const scheduler = {
    isConnected: () => redisConnected && redis !== null,

    async scheduleEpisode(showId, airDate, metadata) {
        if (!this.isConnected()) return false;
        try {
            const timestamp = Math.floor(new Date(airDate).getTime() / 1000);
            const pipe = redis.pipeline();
            pipe.zadd("schedule:episodes", timestamp, `show:${showId}`);
            pipe.hset(`meta:show:${showId}`, {
                name: metadata.name || "",
                nextEp: metadata.nextEp || "",
            });
            await pipe.exec();
            return true;
        } catch (err) {
            console.error("Scheduler scheduleEpisode error:", err.message);
            return false;
        }
    },

    async addToTBA(showId) {
        if (!this.isConnected()) return false;
        try {
            await redis.sadd("schedule:tba", showId.toString());
            return true;
        } catch (err) {
            console.error("Scheduler addToTBA error:", err.message);
            return false;
        }
    },

    async getDueShows() {
        if (!this.isConnected()) return [];
        try {
            const now = Math.floor(Date.now() / 1000);
            return await redis.zrangebyscore("schedule:episodes", 0, now);
        } catch (err) {
            console.error("Scheduler getDueShows error:", err.message);
            return [];
        }
    },

    async getAllScheduled() {
        if (!this.isConnected()) return [];
        try {
            const results = await redis.zrange("schedule:episodes", 0, -1, "WITHSCORES");
            const shows = [];
            for (let i = 0; i < results.length; i += 2) {
                shows.push({
                    showId: results[i],
                    airDate: new Date(parseInt(results[i + 1]) * 1000).toISOString(),
                });
            }
            return shows;
        } catch (err) {
            console.error("Scheduler getAllScheduled error:", err.message);
            return [];
        }
    },

    async getShowMeta(showId) {
        if (!this.isConnected()) return null;
        try {
            return await redis.hgetall(`meta:show:${showId}`);
        } catch (err) {
            console.error("Scheduler getShowMeta error:", err.message);
            return null;
        }
    },

    async removeFromSchedule(member) {
        if (!this.isConnected()) return;
        try {
            await redis.zrem("schedule:episodes", member);
        } catch (err) {
            console.error("Scheduler removeFromSchedule error:", err.message);
        }
    },

    async getTBAShows() {
        if (!this.isConnected()) return [];
        try {
            return await redis.smembers("schedule:tba");
        } catch (err) {
            console.error("Scheduler getTBAShows error:", err.message);
            return [];
        }
    },

    async removeFromTBA(showId) {
        if (!this.isConnected()) return;
        try {
            await redis.srem("schedule:tba", showId.toString());
        } catch (err) {
            console.error("Scheduler removeFromTBA error:", err.message);
        }
    },
};

module.exports = {
    mongo: {
        uri: process.env.MONGO_URI,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
    },
    inviteCodes: process.env.INVITE_CODES.split(",").map((c) => c.trim()).filter(Boolean),
    port: parseInt(process.env.PORT, 10) || 3001,
    cache,
    scheduler,
};
