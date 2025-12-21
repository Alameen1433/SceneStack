import { create } from 'zustand';
import * as dbService from '../services/dbService';
import { socketService } from '../services/socketService';
import { getMovieDetails, getTVDetails, getMovieRecommendations, getTVRecommendations } from '../services/tmdbService';
import type {
    WatchlistItem,
    MovieDetail,
    TVDetail,
    SearchResult,
    MovieWatchlistItem,
    TVWatchlistItem,
} from '../types/types';

interface WatchlistState {
    watchlist: WatchlistItem[];
    isLoading: boolean;
    error: string | null;
    activeTagFilter: string | null;
    
    paginationState: {
        watchlist: { hasMore: boolean; page: number; loading: boolean };
        watching: { hasMore: boolean; page: number; loading: boolean };
        watched: { hasMore: boolean; page: number; loading: boolean };
    };

    recommendations: SearchResult[];
    recommendationsLoading: boolean;

    setWatchlist: (items: WatchlistItem[]) => void;
    setIsLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    setActiveTagFilter: (tag: string | null) => void;

    // Async Operations
    loadWatchlist: () => Promise<void>;
    loadMoreByStatus: (status: 'watchlist' | 'watching' | 'watched') => Promise<void>;
    toggleWatchlist: (media: MovieDetail | TVDetail) => Promise<void>;
    toggleWatchlistFromSearchResult: (media: SearchResult) => Promise<void>;
    toggleMovieWatched: (movieId: number) => Promise<void>;
    toggleEpisodeWatched: (tvId: number, seasonNumber: number, episodeNumber: number) => Promise<void>;
    toggleSeasonWatched: (tvId: number, seasonNumber: number, allEpisodeNumbers: number[]) => Promise<void>;
    updateTags: (mediaId: number, newTags: string[]) => Promise<void>;
    exportWatchlist: () => Promise<void>;
    importWatchlist: (file: File) => Promise<void>;
    fetchRecommendations: () => Promise<void>;

    syncItem: (item: WatchlistItem) => void;
    deleteItem: (id: number) => void;
}

// Track pending local operations to avoid duplicate updates from socket
// This is a module-level singleton, consistent with the store being a singleton
const pendingOps = new Set<number>();

const stripMediaForStorage = (media: MovieDetail | TVDetail): Partial<MovieDetail | TVDetail> => {
    const copy = { ...media } as Record<string, unknown>;
    delete copy.images;
    delete copy.videos;
    delete copy.credits;
    delete copy.keywords;
    delete copy.recommendations;
    delete copy.similar;
    delete copy.reviews;
    return copy as Partial<MovieDetail | TVDetail>;
};

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
    watchlist: [],
    isLoading: true,
    error: null,
    activeTagFilter: null,
    paginationState: {
        watchlist: { hasMore: true, page: 0, loading: false },
        watching: { hasMore: true, page: 0, loading: false },
        watched: { hasMore: true, page: 0, loading: false },
    },
    recommendations: [],
    recommendationsLoading: false,

    setWatchlist: (items) => set({ watchlist: items }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    setActiveTagFilter: (activeTagFilter) => set({ activeTagFilter }),

    loadWatchlist: async () => {
        set({ isLoading: true });
        try {
            const [watchlistRes, watchingRes, watchedRes] = await Promise.all([
                dbService.getWatchlistByStatus('watchlist', 1, 20),
                dbService.getWatchlistByStatus('watching', 1, 20),
                dbService.getWatchlistByStatus('watched', 1, 20),
            ]);

            const allItems = [
                ...watchlistRes.items,
                ...watchingRes.items,
                ...watchedRes.items,
            ];

            set({
                watchlist: allItems,
                isLoading: false,
                paginationState: {
                    watchlist: { hasMore: watchlistRes.hasMore, page: 1, loading: false },
                    watching: { hasMore: watchingRes.hasMore, page: 1, loading: false },
                    watched: { hasMore: watchedRes.hasMore, page: 1, loading: false },
                },
            });
            socketService.connect();
        } catch (err) {
            console.error("Failed to load watchlist from DB", err);
            set({
                error: "Could not load your watchlist. Please try refreshing.",
                isLoading: false
            });
        }
    },

    loadMoreByStatus: async (status) => {
        const { paginationState, watchlist } = get();
        const categoryState = paginationState[status];

        if (!categoryState.hasMore || categoryState.loading) return;

        set({
            paginationState: {
                ...paginationState,
                [status]: { ...categoryState, loading: true },
            },
        });

        try {
            const nextPage = categoryState.page + 1;
            const response = await dbService.getWatchlistByStatus(status, nextPage, 20);

            const existingIds = new Set(watchlist.map(i => i.id));
            const newItems = response.items.filter(item => !existingIds.has(item.id));

            set({
                watchlist: [...watchlist, ...newItems],
                paginationState: {
                    ...get().paginationState,
                    [status]: { hasMore: response.hasMore, page: nextPage, loading: false },
                },
            });
        } catch (err) {
            console.error(`Failed to load more ${status} items`, err);
            set({
                paginationState: {
                    ...get().paginationState,
                    [status]: { ...categoryState, loading: false },
                },
            });
        }
    },

    toggleWatchlist: async (media) => {
        const { watchlist } = get();
        const exists = watchlist.some(item => item.id === media.id);
        pendingOps.add(media.id);

        if (exists) {
            try {
                await dbService.deleteWatchlistItem(media.id);
                set({ watchlist: watchlist.filter(item => item.id !== media.id) });
            } catch (err) {
                set({ error: "Failed to remove item from watchlist." });
                console.error(err);
            }
        } else {
            try {
                const strippedMedia = stripMediaForStorage(media);
                let newItem: WatchlistItem;
                if (media.media_type === "movie") {
                    newItem = { ...strippedMedia, watched: false, tags: [] } as WatchlistItem;
                } else {
                    newItem = { ...strippedMedia, watchedEpisodes: {}, tags: [] } as WatchlistItem;
                }
                await dbService.putWatchlistItem(newItem);
                set({ watchlist: [newItem, ...watchlist] });
            } catch (err) {
                set({ error: "Failed to add item to watchlist." });
                console.error(err);
            }
        }
    },

    toggleWatchlistFromSearchResult: async (media) => {
        const { watchlist, toggleWatchlist } = get();
        const exists = watchlist.some(item => item.id === media.id);

        if (exists) {
            try {
                pendingOps.add(media.id);
                await dbService.deleteWatchlistItem(media.id);
                set({ watchlist: watchlist.filter(item => item.id !== media.id) });
            } catch (err) {
                set({ error: "Failed to remove item from watchlist." });
                console.error(err);
            }
        } else {
            set({ error: null });
            try {
                const details = media.media_type === "movie"
                    ? await getMovieDetails(media.id)
                    : await getTVDetails(media.id);
                await toggleWatchlist(details);
            } catch (err) {
                set({ error: "Failed to add item to watchlist." });
                console.error(err);
            }
        }
    },

    toggleMovieWatched: async (movieId) => {
        const { watchlist } = get();
        const itemToUpdate = watchlist.find(
            (item) => item.id === movieId && item.media_type === "movie"
        ) as MovieWatchlistItem | undefined;

        if (!itemToUpdate) return;

        pendingOps.add(movieId);
        const updatedItem = { ...itemToUpdate, watched: !itemToUpdate.watched };

        set({
            watchlist: watchlist.map((item) => (item.id === movieId ? updatedItem : item))
        });

        try {
            await dbService.putWatchlistItem(updatedItem);
        } catch (err) {
            set({
                watchlist: watchlist.map((item) => (item.id === movieId ? itemToUpdate : item)),
                error: "Failed to save progress. Please try again."
            });
            console.error(err);
        }
    },

    toggleEpisodeWatched: async (tvId, seasonNumber, episodeNumber) => {
        const { watchlist } = get();
        const itemToUpdate = watchlist.find(
            (item) => item.id === tvId && item.media_type === "tv"
        ) as TVWatchlistItem | undefined;

        if (!itemToUpdate) return;

        pendingOps.add(tvId);

        const newWatchedEpisodes = { ...(itemToUpdate.watchedEpisodes || {}) };
        const seasonEpisodes = newWatchedEpisodes[seasonNumber]
            ? [...newWatchedEpisodes[seasonNumber]]
            : [];
        const episodeIndex = seasonEpisodes.indexOf(episodeNumber);

        if (episodeIndex > -1) {
            seasonEpisodes.splice(episodeIndex, 1);
        } else {
            seasonEpisodes.push(episodeNumber);
        }
        newWatchedEpisodes[seasonNumber] = seasonEpisodes;

        const updatedItem = {
            ...itemToUpdate,
            watchedEpisodes: newWatchedEpisodes,
        };

        set({
            watchlist: watchlist.map((item) => (item.id === tvId ? updatedItem : item))
        });

        try {
            await dbService.putWatchlistItem(updatedItem);
        } catch (err) {
            set({
                watchlist: watchlist.map((item) => (item.id === tvId ? itemToUpdate : item)),
                error: "Failed to save progress. Please try again."
            });
            console.error(err);
        }
    },

    toggleSeasonWatched: async (tvId, seasonNumber, allEpisodeNumbers) => {
        const { watchlist } = get();
        const itemToUpdate = watchlist.find(
            (item) => item.id === tvId && item.media_type === "tv"
        ) as TVWatchlistItem | undefined;

        if (!itemToUpdate) return;

        pendingOps.add(tvId);

        const newWatchedEpisodes = { ...(itemToUpdate.watchedEpisodes || {}) };
        const seasonEpisodes = newWatchedEpisodes[seasonNumber] || [];

        if (seasonEpisodes.length === allEpisodeNumbers.length) {
            newWatchedEpisodes[seasonNumber] = [];
        } else {
            newWatchedEpisodes[seasonNumber] = allEpisodeNumbers;
        }

        const updatedItem = {
            ...itemToUpdate,
            watchedEpisodes: newWatchedEpisodes,
        };

        set({
            watchlist: watchlist.map((item) => (item.id === tvId ? updatedItem : item))
        });

        try {
            await dbService.putWatchlistItem(updatedItem);
        } catch (err) {
            set({
                watchlist: watchlist.map((item) => (item.id === tvId ? itemToUpdate : item)),
                error: "Failed to save progress. Please try again."
            });
            console.error(err);
        }
    },

    updateTags: async (mediaId, newTags) => {
        const { watchlist } = get();
        const itemToUpdate = await dbService.getWatchlistItem(mediaId);

        if (itemToUpdate) {
            pendingOps.add(mediaId);
            const updatedItem = { ...itemToUpdate, tags: newTags };

            set({
                watchlist: watchlist.map((item) => (item.id === mediaId ? updatedItem : item))
            });

            await dbService.putWatchlistItem(updatedItem);
        }
    },

    exportWatchlist: async () => {
        try {
            const itemsToExport = await dbService.getAllWatchlistItems();
            const dataStr = JSON.stringify(itemsToExport, null, 2);
            const dataBlob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `scenestack_watchlist_${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            set({ error: "Failed to export watchlist." });
            console.error(err);
        }
    },

    importWatchlist: async (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const text = e.target?.result;
                    if (typeof text !== "string") throw new Error("File content is not readable.");

                    const importedData = JSON.parse(text) as WatchlistItem[];

                    if (!Array.isArray(importedData)) {
                        throw new Error("Invalid file format: Not an array.");
                    }

                    const strippedItems = importedData.map(item => {
                        const copy = { ...item } as Record<string, unknown>;
                        delete copy.images;
                        delete copy.videos;
                        delete copy.credits;
                        delete copy.keywords;
                        delete copy.recommendations;
                        delete copy.similar;
                        delete copy.reviews;
                        return copy as unknown as WatchlistItem;
                    });

                    await dbService.clearAndBulkPut(strippedItems);
                    set({ watchlist: strippedItems });
                    resolve();
                } catch (err) {
                    set({ error: "Import failed. Please ensure the file is a valid Scene Stack JSON export." });
                    console.error(err);
                    resolve();
                }
            };
            reader.onerror = () => {
                set({ error: "Failed to read the selected file." });
                resolve();
            };
            reader.readAsText(file);
        });
    },

    fetchRecommendations: async () => {
        const { watchlist } = get();

        if (watchlist.length === 0) {
            set({ recommendations: [] });
            return;
        }

        set({ recommendationsLoading: true });

        try {
            const watchlistIds = new Set(watchlist.map(item => item.id));
            const shuffled = [...watchlist].sort(() => 0.5 - Math.random());
            const seedItems = shuffled.slice(0, 3);

            const recPromises = seedItems.map((item) =>
                item.media_type === "movie"
                    ? getMovieRecommendations(item.id)
                    : getTVRecommendations(item.id)
            );

            const recArrays = await Promise.all(recPromises);
            const flatRecs = recArrays.flat();

            const uniqueRecsMap = new Map<number, SearchResult>();
            flatRecs.forEach((rec) => {
                if (!watchlistIds.has(rec.id) && rec.poster_path) {
                    uniqueRecsMap.set(rec.id, rec);
                }
            });

            set({
                recommendations: Array.from(uniqueRecsMap.values()),
                recommendationsLoading: false
            });
        } catch (err) {
            console.error("Failed to fetch recommendations:", err);
            set({ recommendationsLoading: false });
        }
    },

    // Socket Helpers
    syncItem: (item) => {
        if (pendingOps.has(item.id)) {
            pendingOps.delete(item.id);
            return;
        }
        const { watchlist } = get();
        const exists = watchlist.some((i) => i.id === item.id);
        if (exists) {
            set({ watchlist: watchlist.map((i) => (i.id === item.id ? item : i)) });
        } else {
            set({ watchlist: [item, ...watchlist] });
        }
    },

    deleteItem: (id) => {
        if (pendingOps.has(id)) {
            pendingOps.delete(id);
            return;
        }
        const { watchlist } = get();
        set({ watchlist: watchlist.filter((i) => i.id !== id) });
    }
}));

export const getWatchlistIds = (watchlist: WatchlistItem[]) =>
    new Set(watchlist.map(item => item.id));

export const getFilteredItems = (watchlist: WatchlistItem[], activeTagFilter: string | null) => {
    let filteredWatchlist = watchlist;
    if (activeTagFilter) {
        filteredWatchlist = watchlist.filter((item) =>
            item.tags?.includes(activeTagFilter)
        );
    }

    const watchlistItems: WatchlistItem[] = [];
    const currentlyWatchingItems: TVWatchlistItem[] = [];
    const watchedItems: WatchlistItem[] = [];

    for (const item of filteredWatchlist) {
        // Use server-computed status if available, otherwise compute locally
        let status = item.watchlistStatus;
        if (!status) {
            if (item.media_type === "movie") {
                status = item.watched ? "watched" : "watchlist";
            } else {
                const watchedCount = Object.values(item.watchedEpisodes || {}).reduce(
                    (acc, eps) => acc + (Array.isArray(eps) ? eps.length : 0), 0
                );
                if (watchedCount === 0) status = "watchlist";
                else if (watchedCount >= item.number_of_episodes) status = "watched";
                else status = "watching";
            }
        }

        if (status === "watched") {
            watchedItems.push(item);
        } else if (status === "watching" && item.media_type === "tv") {
            currentlyWatchingItems.push(item);
        } else {
            watchlistItems.push(item);
        }
    }
    return { watchlistItems, currentlyWatchingItems, watchedItems };
};

export const getProgressMap = (currentlyWatchingItems: TVWatchlistItem[]) => {
    const map: Record<string, number> = {};
    currentlyWatchingItems.forEach((item) => {
        const watchedCount = Object.values(item.watchedEpisodes || {}).reduce(
            (acc, eps) => acc + (Array.isArray(eps) ? eps.length : 0),
            0
        );
        const progress =
            item.number_of_episodes > 0
                ? (watchedCount / item.number_of_episodes) * 100
                : 0;
        map[item.id] = progress;
    });
    return map;
};

export const getAllUniqueTags = (watchlist: WatchlistItem[]) => {
    const tags = new Set<string>();
    watchlist.forEach((item) => {
        item.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
};



export const formatWatchTime = (minutes: number): string => {
    if (minutes === 0) return "0m";

    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const mins = Math.floor(minutes % 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);

    return parts.join(" ") || "0m";
};

export interface WatchStatistics {
    shows: {
        totalWatchTimeMinutes: number;
        totalEpisodes: number;
        totalShows: number;
    };
    movies: {
        totalWatchTimeMinutes: number;
        totalMovies: number;
    };
    summary: {
        currentlyWatching: number;
        completionRate: number;
        topGenres: { name: string; count: number }[];
        averageRating: number;
    };
}

export const calculateWatchStats = (
    watchlist: WatchlistItem[],
    currentlyWatchingCount: number,
    watchedItems: WatchlistItem[]
): WatchStatistics => {
    const AVG_EPISODE_RUNTIME = 45; // fallback

    const movies = watchlist.filter((item): item is MovieWatchlistItem => item.media_type === "movie");
    const tvShows = watchlist.filter((item): item is TVWatchlistItem => item.media_type === "tv");

    // Watched movies
    const watchedMovies = movies.filter(m => m.watched);
    const movieWatchTime = watchedMovies.reduce((acc, m) => acc + (m.runtime || 0), 0);

    // Watched TV episodes - use per-show runtime when available
    let totalWatchedEpisodes = 0;
    let totalWatchedShows = 0;
    let tvWatchTime = 0;

    tvShows.forEach(show => {
        const episodeCount = Object.values(show.watchedEpisodes || {}).reduce(
            (acc, eps) => acc + (Array.isArray(eps) ? eps.length : 0),
            0
        );
        if (episodeCount > 0) {
            totalWatchedEpisodes += episodeCount;
            // Use show's episode_run_time if available, otherwise fallback to average
            const episodeRuntime = show.episode_run_time?.[0] || AVG_EPISODE_RUNTIME;
            tvWatchTime += episodeCount * episodeRuntime;
            if (episodeCount >= show.number_of_episodes) {
                totalWatchedShows++;
            }
        }
    });
    const totalItems = watchlist.length;
    const completedItems = watchedItems.length;
    const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Genre breakdown
    const genreCounts: Record<string, number> = {};
    watchedItems.forEach(item => {
        item.genres?.forEach(genre => {
            genreCounts[genre.name] = (genreCounts[genre.name] || 0) + 1;
        });
    });
    const topGenres = Object.entries(genreCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const ratings = watchedItems.map(item => item.vote_average).filter(r => r > 0);
    const averageRating = ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0;

    return {
        shows: {
            totalWatchTimeMinutes: tvWatchTime,
            totalEpisodes: totalWatchedEpisodes,
            totalShows: totalWatchedShows,
        },
        movies: {
            totalWatchTimeMinutes: movieWatchTime,
            totalMovies: watchedMovies.length,
        },
        summary: {
            currentlyWatching: currentlyWatchingCount,
            completionRate,
            topGenres,
            averageRating,
        },
    };
};
