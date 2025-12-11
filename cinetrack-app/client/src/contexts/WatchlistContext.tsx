import {
    useEffect,
    useMemo,
    type ReactNode,
} from "react";
import { createContext, useContextSelector } from "use-context-selector";
import { socketService } from "../services/socketService";
import type {
    WatchlistItem,
    MovieDetail,
    TVDetail,
    SearchResult,
    TVWatchlistItem,
} from "../types/types";

import {
    useWatchlistStore,
    getWatchlistIds,
    getProgressMap,
    getFilteredItems,
} from "../store/useWatchlistStore";

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
    const watchlist = useWatchlistStore(state => state.watchlist);
    const activeTagFilter = useWatchlistStore(state => state.activeTagFilter);
    const isLoading = useWatchlistStore(state => state.isLoading);
    const error = useWatchlistStore(state => state.error);
    const setError = useWatchlistStore(state => state.setError);
    const setActiveTagFilter = useWatchlistStore(state => state.setActiveTagFilter);
    const loadWatchlist = useWatchlistStore(state => state.loadWatchlist);
    const toggleWatchlist = useWatchlistStore(state => state.toggleWatchlist);
    const toggleWatchlistFromSearchResult = useWatchlistStore(state => state.toggleWatchlistFromSearchResult);
    const toggleMovieWatched = useWatchlistStore(state => state.toggleMovieWatched);
    const toggleEpisodeWatched = useWatchlistStore(state => state.toggleEpisodeWatched);
    const toggleSeasonWatched = useWatchlistStore(state => state.toggleSeasonWatched);
    const updateTags = useWatchlistStore(state => state.updateTags);
    const exportWatchlist = useWatchlistStore(state => state.exportWatchlist);
    const storeImportWatchlist = useWatchlistStore(state => state.importWatchlist);
    const syncItem = useWatchlistStore(state => state.syncItem);
    const deleteItem = useWatchlistStore(state => state.deleteItem);

    // Derived state locally memoized to ensure stability and prevent loops
    const watchlistIds = useMemo(
        () => new Set(watchlist.map((item) => item.id)),
        [watchlist]
    );

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

    // Progress map
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

    // Initial load and socket connection
    useEffect(() => {
        loadWatchlist();

        return () => {
            socketService.disconnect();
        };
    }, [loadWatchlist]);

    // Socket listeners
    useEffect(() => {
        const unsubUpdate = socketService.onUpdate((item) => {
            syncItem(item);
        });

        const unsubDelete = socketService.onDelete(({ id }) => {
            deleteItem(id);
        });

        const unsubSync = socketService.onSync(async () => {
            // Re-load full list on sync request
            loadWatchlist();
        });

        return () => {
            unsubUpdate();
            unsubDelete();
            unsubSync();
        };
    }, [syncItem, deleteItem, loadWatchlist]);

    // Adapter for importWatchlist to match Context signature
    const handleImportWatchlist = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (window.confirm("Are you sure you want to overwrite your current watchlist? This action cannot be undone.")) {
                storeImportWatchlist(file);
            }
        }
        event.target.value = "";
    };

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
            importWatchlist: handleImportWatchlist,
        }),
        [
            watchlist,
            watchlistIds,
            isLoading,
            error,
            setError, // stable
            watchlistItems,
            currentlyWatchingItems,
            watchedItems,
            progressMap,
            allUniqueTags,
            activeTagFilter,
            setActiveTagFilter, // stable
            toggleWatchlist, // stable
            toggleWatchlistFromSearchResult, // stable
            toggleMovieWatched, // stable
            toggleEpisodeWatched, // stable
            toggleSeasonWatched, // stable
            updateTags, // stable
            exportWatchlist, // stable
            handleImportWatchlist // stable (created in render but deps are [])
        ]
    );

    return (
        <WatchlistContext.Provider value={value}>
            {children}
        </WatchlistContext.Provider>
    );
};

// ============================================================================
// HOOKS (Backward Compatible)
// ============================================================================

export const useWatchlistContext = (): WatchlistContextType => {
    const context = useContextSelector(WatchlistContext, (ctx) => ctx);
    if (context === undefined) {
        throw new Error(
            "useWatchlistContext must be used within a WatchlistProvider"
        );
    }
    return context;
};

// ============================================================================
// OPTIMIZED SELECTOR HOOKS (Delegating to Store directly where possible or Context)
// ============================================================================

// pointing these to the store directly for better performance!
// This bypasses the Context completely for these specific hooks, 

export const useWatchlistIds = () => {
    const watchlist = useWatchlistStore(state => state.watchlist);
    return useMemo(() => getWatchlistIds(watchlist), [watchlist]);
};

export const useWatchlistLoading = (): boolean => {
    return useWatchlistStore(state => state.isLoading);
};

export const useWatchlist = (): WatchlistItem[] => {
    return useWatchlistStore(state => state.watchlist);
};

export const useProgressMap = () => {
    const watchlist = useWatchlistStore(state => state.watchlist);
    const { currentlyWatchingItems } = useMemo(() => getFilteredItems(watchlist, null), [watchlist]);
    return useMemo(() => getProgressMap(currentlyWatchingItems), [currentlyWatchingItems]);
};


