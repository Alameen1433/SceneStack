const express = require("express");
const { asyncHandler } = require("../middleware/errorHandler");
const { cache } = require("../config");

const router = express.Router();

const TMDB_API_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_API_TOKEN = process.env.TMDB_API_READ_ACCESS_TOKEN;

const TTL = {
    DISCOVER: 6 * 60 * 60,
    SEARCH: 60 * 60,
    DETAILS: 60 * 60,
    RECOMMENDATIONS: 6 * 60 * 60,
    IMAGES: 24 * 60 * 60,
    SEASON: 6 * 60 * 60,
    PROVIDERS: 24 * 60 * 60,
};

const LIMITS = {
    SEARCH: 1000,
    DETAILS: 500,
    RECOMMENDATIONS: 200,
};

if (!TMDB_API_TOKEN) {
    console.error("WARNING: TMDB_API_READ_ACCESS_TOKEN is not set in server .env");
}

const fetchFromTMDB = async (endpoint) => {
    const url = `${TMDB_API_BASE_URL}/${endpoint}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                accept: "application/json",
                Authorization: `Bearer ${TMDB_API_TOKEN}`,
            },
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => "");
            throw new Error(`TMDB API error: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        return response.json();
    } catch (err) {
        console.error(`TMDB fetch failed for: ${url}`);
        console.error("Error details:", err.cause || err.message);
        throw err;
    }
};

const filterMediaResults = (results) =>
    results.filter((item) => item.media_type === "movie" || item.media_type === "tv");

const addMediaType = (results, type) =>
    results.map((item) => ({ ...item, media_type: type }));

router.get(
    "/discover",
    asyncHandler(async (req, res) => {
        const cacheKey = "tmdb:discover";

        const cached = await cache.get(cacheKey);
        if (cached) {
            res.set("X-Cache", "HIT");
            return res.json(cached);
        }

        const [trending, popularMovies, popularTV] = await Promise.all([
            fetchFromTMDB("trending/all/week"),
            fetchFromTMDB("movie/popular"),
            fetchFromTMDB("tv/popular"),
        ]);

        const data = {
            trending: filterMediaResults(trending.results),
            popularMovies: addMediaType(popularMovies.results, "movie"),
            popularTV: addMediaType(popularTV.results, "tv"),
        };

        await cache.set(cacheKey, data, TTL.DISCOVER);
        res.set("X-Cache", "MISS");
        res.json(data);
    })
);

router.get(
    "/search",
    asyncHandler(async (req, res) => {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ message: "Query parameter 'q' is required" });
        }

        const cacheKey = `tmdb:search:${query.toLowerCase().trim()}`;
        const indexKey = "tmdb:search:index";

        const cached = await cache.get(cacheKey);
        if (cached) {
            res.set("X-Cache", "HIT");
            return res.json(cached);
        }

        const response = await fetchFromTMDB(`search/multi?query=${encodeURIComponent(query)}`);
        const data = { results: filterMediaResults(response.results) };

        await cache.setWithLimit(cacheKey, data, TTL.SEARCH, indexKey, LIMITS.SEARCH);
        res.set("X-Cache", "MISS");
        res.json(data);
    })
);

router.get(
    "/details/:type/:id",
    asyncHandler(async (req, res) => {
        const { type, id } = req.params;

        if (type !== "movie" && type !== "tv") {
            return res.status(400).json({ message: "Type must be 'movie' or 'tv'" });
        }

        const cacheKey = `tmdb:details:${type}:${id}`;
        const indexKey = "tmdb:details:index";

        const cached = await cache.get(cacheKey);
        if (cached) {
            res.set("X-Cache", "HIT");
            return res.json(cached);
        }

        const details = await fetchFromTMDB(
            `${type}/${id}?append_to_response=videos,credits,images`
        );
        const data = { ...details, media_type: type };

        await cache.setWithLimit(cacheKey, data, TTL.DETAILS, indexKey, LIMITS.DETAILS);
        res.set("X-Cache", "MISS");
        res.json(data);
    })
);

router.get(
    "/season/:tvId/:seasonNumber",
    asyncHandler(async (req, res) => {
        const { tvId, seasonNumber } = req.params;
        const cacheKey = `tmdb:season:${tvId}:${seasonNumber}`;

        const cached = await cache.get(cacheKey);
        if (cached) {
            res.set("X-Cache", "HIT");
            return res.json(cached);
        }

        const data = await fetchFromTMDB(`tv/${tvId}/season/${seasonNumber}`);

        await cache.set(cacheKey, data, TTL.SEASON);
        res.set("X-Cache", "MISS");
        res.json(data);
    })
);

router.get(
    "/providers/:type/:id",
    asyncHandler(async (req, res) => {
        const { type, id } = req.params;

        if (type !== "movie" && type !== "tv") {
            return res.status(400).json({ message: "Type must be 'movie' or 'tv'" });
        }

        const cacheKey = `tmdb:providers:${type}:${id}`;

        const cached = await cache.get(cacheKey);
        if (cached) {
            res.set("X-Cache", "HIT");
            return res.json(cached);
        }

        const data = await fetchFromTMDB(`${type}/${id}/watch/providers`);

        await cache.set(cacheKey, data, TTL.PROVIDERS);
        res.set("X-Cache", "MISS");
        res.json(data);
    })
);

router.get(
    "/recommendations/:type/:id",
    asyncHandler(async (req, res) => {
        const { type, id } = req.params;

        if (type !== "movie" && type !== "tv") {
            return res.status(400).json({ message: "Type must be 'movie' or 'tv'" });
        }

        const cacheKey = `tmdb:recommendations:${type}:${id}`;
        const indexKey = "tmdb:recommendations:index";

        const cached = await cache.get(cacheKey);
        if (cached) {
            res.set("X-Cache", "HIT");
            return res.json(cached);
        }

        const response = await fetchFromTMDB(`${type}/${id}/recommendations`);
        const data = { results: addMediaType(response.results, type) };

        await cache.setWithLimit(cacheKey, data, TTL.RECOMMENDATIONS, indexKey, LIMITS.RECOMMENDATIONS);
        res.set("X-Cache", "MISS");
        res.json(data);
    })
);

router.get(
    "/images/:type/:id",
    asyncHandler(async (req, res) => {
        const { type, id } = req.params;

        if (type !== "movie" && type !== "tv") {
            return res.status(400).json({ message: "Type must be 'movie' or 'tv'" });
        }

        const cacheKey = `tmdb:images:${type}:${id}`;

        const cached = await cache.get(cacheKey);
        if (cached) {
            res.set("X-Cache", "HIT");
            return res.json(cached);
        }

        const data = await fetchFromTMDB(`${type}/${id}/images`);

        await cache.set(cacheKey, data, TTL.IMAGES);
        res.set("X-Cache", "MISS");
        res.json(data);
    })
);

module.exports = router;
