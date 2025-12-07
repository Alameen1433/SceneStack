import { useState, useCallback } from "react";
import {
    getMovieRecommendations,
    getTVRecommendations,
} from "../services/tmdbService";
import type { SearchResult, WatchlistItem } from "../types/types";

interface UseRecommendationsReturn {
    recommendations: SearchResult[];
    isLoading: boolean;
    error: string | null;
    fetchRecommendations: () => Promise<void>;
}

export const useRecommendations = (
    watchlist: WatchlistItem[],
    watchlistIds: Set<number>
): UseRecommendationsReturn => {
    const [recommendations, setRecommendations] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRecommendations = useCallback(async () => {
        if (watchlist.length === 0) {
            setRecommendations([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Pick up to 3 random items from watchlist as seeds
            const shuffled = [...watchlist].sort(() => 0.5 - Math.random());
            const seedItems = shuffled.slice(0, 3);

            const recPromises = seedItems.map((item) =>
                item.media_type === "movie"
                    ? getMovieRecommendations(item.id)
                    : getTVRecommendations(item.id)
            );

            const recArrays = await Promise.all(recPromises);
            const flatRecs = recArrays.flat();

            // Deduplicate and filter out items already in watchlist
            const uniqueRecsMap = new Map<number, SearchResult>();
            flatRecs.forEach((rec) => {
                if (!watchlistIds.has(rec.id) && rec.poster_path) {
                    uniqueRecsMap.set(rec.id, rec);
                }
            });

            setRecommendations(Array.from(uniqueRecsMap.values()));
        } catch (err) {
            setError("Failed to fetch recommendations.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [watchlist, watchlistIds]);

    return {
        recommendations,
        isLoading,
        error,
        fetchRecommendations,
    };
};
