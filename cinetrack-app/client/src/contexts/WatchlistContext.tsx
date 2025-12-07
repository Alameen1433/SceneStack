import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useMemo,
    type ReactNode,
} from "react";
import * as dbService from "../services/dbService";
import { getMovieDetails, getTVDetails } from "../services/tmdbService";
import type {
    WatchlistItem,
    MovieDetail,
    TVDetail,
    SearchResult,
    MovieWatchlistItem,
    TVWatchlistItem,
} from "../types/types";

interface WatchlistContextType {
    watchlist: WatchlistItem[];
    watchlistIds: Set<number>;
    isLoading: boolean;
    error: string | null;
    setError: (error: string | null) => void;

    // Derived data
    watchlistItems: WatchlistItem[];
    currentlyWatchingItems: TVWatchlistItem[];
    watchedItems: WatchlistItem[];
    progressMap: Record<string, number>;
    allUniqueTags: string[];
    activeTagFilter: string | null;
    setActiveTagFilter: (tag: string | null) => void;

    // Operations
    toggleWatchlist: (media: MovieDetail | TVDetail) => Promise<void>;
    toggleWatchlistFromSearchResult: (media: SearchResult) => Promise<void>;
    toggleMovieWatched: (movieId: number) => Promise<void>;
    toggleEpisodeWatched: (
        tvId: number,
        seasonNumber: number,
        episodeNumber: number
    ) => Promise<void>;
    toggleSeasonWatched: (
        tvId: number,
        seasonNumber: number,
        allEpisodeNumbers: number[]
    ) => Promise<void>;
    updateTags: (mediaId: number, newTags: string[]) => Promise<void>;
    exportWatchlist: () => Promise<void>;
    importWatchlist: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(
    undefined
);

export const WatchlistProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

    const watchlistIds = useMemo(
        () => new Set(watchlist.map((item) => item.id)),
        [watchlist]
    );

    // Load watchlist on mount
    useEffect(() => {
        const loadWatchlist = async () => {
            setIsLoading(true);
            try {
                const items = await dbService.getAllWatchlistItems();
                setWatchlist(items);
            } catch (err) {
                console.error("Failed to load watchlist from DB", err);
                setError("Could not load your watchlist. Please try refreshing.");
            } finally {
                setIsLoading(false);
            }
        };
        loadWatchlist();
    }, []);

    // Derived filtered lists
    const { watchlistItems, currentlyWatchingItems, watchedItems } =
        useMemo(() => {
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
                if (item.media_type === "movie") {
                    if (item.watched) {
                        watchedItems.push(item);
                    } else {
                        watchlistItems.push(item);
                    }
                } else if (item.media_type === "tv") {
                    const watchedCount = Object.values(item.watchedEpisodes || {}).reduce(
                        (acc, eps) => acc + (Array.isArray(eps) ? eps.length : 0),
                        0
                    );
                    if (watchedCount === 0) {
                        watchlistItems.push(item);
                    } else if (
                        watchedCount > 0 &&
                        watchedCount < item.number_of_episodes
                    ) {
                        currentlyWatchingItems.push(item);
                    } else if (
                        watchedCount > 0 &&
                        watchedCount >= item.number_of_episodes
                    ) {
                        watchedItems.push(item);
                    } else {
                        watchlistItems.push(item);
                    }
                }
            }
            return { watchlistItems, currentlyWatchingItems, watchedItems };
        }, [watchlist, activeTagFilter]);

    // Progress map for currently watching items
    const progressMap = useMemo(() => {
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
    }, [currentlyWatchingItems]);

    // All unique tags
    const allUniqueTags = useMemo(() => {
        const tags = new Set<string>();
        watchlist.forEach((item) => {
            item.tags?.forEach((tag) => tags.add(tag));
        });
        return Array.from(tags).sort();
    }, [watchlist]);

    // Toggle watchlist from detail view
    const toggleWatchlist = useCallback(
        async (media: MovieDetail | TVDetail) => {
            if (watchlistIds.has(media.id)) {
                await dbService.deleteWatchlistItem(media.id);
                setWatchlist((prev) => prev.filter((item) => item.id !== media.id));
            } else {
                let newItem: WatchlistItem;
                if (media.media_type === "movie") {
                    newItem = { ...media, watched: false, tags: [] };
                } else {
                    newItem = { ...media, watchedEpisodes: {}, tags: [] };
                }
                await dbService.putWatchlistItem(newItem);
                setWatchlist((prev) => [...prev, newItem]);
            }
        },
        [watchlistIds]
    );

    // Toggle watchlist from search result (needs to fetch details first)
    const toggleWatchlistFromSearchResult = useCallback(
        async (media: SearchResult) => {
            if (watchlistIds.has(media.id)) {
                try {
                    await dbService.deleteWatchlistItem(media.id);
                    setWatchlist((prev) => prev.filter((item) => item.id !== media.id));
                } catch (err) {
                    setError("Failed to remove item from watchlist.");
                    console.error(err);
                }
            } else {
                setError(null);
                try {
                    const details =
                        media.media_type === "movie"
                            ? await getMovieDetails(media.id)
                            : await getTVDetails(media.id);
                    await toggleWatchlist(details);
                } catch (err) {
                    setError("Failed to add item to watchlist.");
                    console.error(err);
                }
            }
        },
        [watchlistIds, toggleWatchlist]
    );

    // Toggle movie watched status
    const toggleMovieWatched = useCallback(async (movieId: number) => {
        setWatchlist((prev) => {
            const itemToUpdate = prev.find(
                (item) => item.id === movieId && item.media_type === "movie"
            ) as MovieWatchlistItem | undefined;

            if (!itemToUpdate) return prev;

            const updatedItem = { ...itemToUpdate, watched: !itemToUpdate.watched };
            dbService.putWatchlistItem(updatedItem);

            return prev.map((item) => (item.id === movieId ? updatedItem : item));
        });
    }, []);

    // Toggle episode watched status
    const toggleEpisodeWatched = useCallback(
        async (tvId: number, seasonNumber: number, episodeNumber: number) => {
            setWatchlist((prev) => {
                const itemToUpdate = prev.find(
                    (item) => item.id === tvId && item.media_type === "tv"
                ) as TVWatchlistItem | undefined;

                if (!itemToUpdate) return prev;

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
                dbService.putWatchlistItem(updatedItem);

                return prev.map((item) => (item.id === tvId ? updatedItem : item));
            });
        },
        []
    );

    // Toggle entire season watched
    const toggleSeasonWatched = useCallback(
        async (
            tvId: number,
            seasonNumber: number,
            allEpisodeNumbers: number[]
        ) => {
            setWatchlist((prev) => {
                const itemToUpdate = prev.find(
                    (item) => item.id === tvId && item.media_type === "tv"
                ) as TVWatchlistItem | undefined;

                if (!itemToUpdate) return prev;

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
                dbService.putWatchlistItem(updatedItem);

                return prev.map((item) => (item.id === tvId ? updatedItem : item));
            });
        },
        []
    );

    // Update tags
    const updateTags = useCallback(async (mediaId: number, newTags: string[]) => {
        const itemToUpdate = await dbService.getWatchlistItem(mediaId);
        if (itemToUpdate) {
            const updatedItem = { ...itemToUpdate, tags: newTags };
            await dbService.putWatchlistItem(updatedItem);
            setWatchlist((prev) =>
                prev.map((item) => (item.id === mediaId ? updatedItem : item))
            );
        }
    }, []);

    // Export watchlist
    const exportWatchlist = useCallback(async () => {
        try {
            const itemsToExport = await dbService.getAllWatchlistItems();
            const dataStr = JSON.stringify(itemsToExport, null, 2);
            const dataBlob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `scenestack_watchlist_${new Date().toISOString().split("T")[0]
                }.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            setError("Failed to export watchlist.");
            console.error(err);
        }
    }, []);

    // Import watchlist
    const importWatchlist = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const text = e.target?.result;
                    if (typeof text !== "string")
                        throw new Error("File content is not readable.");

                    const importedData = JSON.parse(text) as WatchlistItem[];

                    if (!Array.isArray(importedData)) {
                        throw new Error("Invalid file format: Not an array.");
                    }

                    if (
                        window.confirm(
                            "Are you sure you want to overwrite your current watchlist? This action cannot be undone."
                        )
                    ) {
                        await dbService.clearAndBulkPut(importedData);
                        setWatchlist(importedData);
                    }
                } catch (err) {
                    setError(
                        "Import failed. Please ensure the file is a valid Scene Stack JSON export."
                    );
                    console.error(err);
                }
            };
            reader.onerror = () => {
                setError("Failed to read the selected file.");
            };
            reader.readAsText(file);
            event.target.value = "";
        },
        []
    );

    const value = useMemo(
        () => ({
            watchlist,
            watchlistIds,
            isLoading,
            error,
            setError,
            watchlistItems,
            currentlyWatchingItems,
            watchedItems,
            progressMap,
            allUniqueTags,
            activeTagFilter,
            setActiveTagFilter,
            toggleWatchlist,
            toggleWatchlistFromSearchResult,
            toggleMovieWatched,
            toggleEpisodeWatched,
            toggleSeasonWatched,
            updateTags,
            exportWatchlist,
            importWatchlist,
        }),
        [
            watchlist,
            watchlistIds,
            isLoading,
            error,
            watchlistItems,
            currentlyWatchingItems,
            watchedItems,
            progressMap,
            allUniqueTags,
            activeTagFilter,
            toggleWatchlist,
            toggleWatchlistFromSearchResult,
            toggleMovieWatched,
            toggleEpisodeWatched,
            toggleSeasonWatched,
            updateTags,
            exportWatchlist,
            importWatchlist,
        ]
    );

    return (
        <WatchlistContext.Provider value={value}>
            {children}
        </WatchlistContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useWatchlistContext = (): WatchlistContextType => {
    const context = useContext(WatchlistContext);
    if (context === undefined) {
        throw new Error(
            "useWatchlistContext must be used within a WatchlistProvider"
        );
    }
    return context;
};
