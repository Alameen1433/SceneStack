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

            // Set index TTL to 2x item TTL (auto-cleanup of orphan references)
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

module.exports = {
    mongo: {
        uri: process.env.MONGO_URI,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
    },
    inviteCodes: process.env.INVITE_CODES.split(",").map((c) => c.trim()).filter(Boolean),
    demoCode: process.env.DEMO_CODE || "DEMONOW",
    demoTtlSeconds: parseInt(process.env.DEMO_TTL_SECONDS, 10) || 14400,
    port: parseInt(process.env.PORT, 10) || 3001,
    cache,
};
