import React, { useState, useCallback, useMemo, useEffect } from "react";
import { SearchBar } from "./components/SearchBar";
import { MediaGrid } from "./components/MediaGrid";
import { MediaDetailModal } from "./components/MediaDetailModal";
import { SettingsModal } from "./components/SettingsModal";
import * as dbService from "./services/dbService";
import {
  searchMedia,
  getMovieDetails,
  getTVDetails,
  getTVSeasonDetails,
  getMovieRecommendations,
  getTVRecommendations,
  getTrendingMedia,
  getPopularMovies,
  getPopularTVShows,
} from "./services/tmdbService";
import type {
  SearchResult,
  WatchlistItem,
  MovieDetail,
  TVDetail,
  //SeasonDetail,
  Media,
  TVWatchlistItem,
  MovieWatchlistItem,
} from "./types";
import { LoadingPosterAnimation } from "./components/LoadingPosterAnimation";
import { BottomNavBar } from "./components/BottomNavBar";
import { SideNavBar } from "./components/SideNavBar";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { Carousel } from "./components/Carousal";

const MediaSection: React.FC<{
  title: string;
  items: Media[];
  onCardClick: (media: Media, rect: DOMRect) => void;
  watchlistIds: Set<number>;
  progressMap?: Record<string, number>;
  emptyMessage: string;
  emptySubMessage?: string;
  selectedMediaId: string | null;
}> = ({
  title,
  items,
  onCardClick,
  watchlistIds,
  progressMap,
  emptyMessage,
  emptySubMessage,
  selectedMediaId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const itemsToShow = 12; // Approx 2 rows on larger screens

  const displayedItems = isExpanded ? items : items.slice(0, itemsToShow);

  return (
    <section>
      <h2 className="text-3xl font-bold mb-6 text-brand-text-light">{title}</h2>
      {items.length > 0 ? (
        <>
          <MediaGrid
            mediaItems={displayedItems}
            onCardClick={onCardClick}
            watchlistIds={watchlistIds}
            progressMap={progressMap}
            selectedMediaId={selectedMediaId}
          />
          {items.length > itemsToShow && (
            <div className="text-center mt-8">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="bg-brand-surface hover:bg-brand-primary/50 text-brand-text-light font-semibold py-2 px-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-brand-bg"
              >
                {isExpanded ? "Show Less" : "Show More"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10 px-6 bg-brand-surface/50 rounded-lg">
          <p className="text-brand-text-dim">{emptyMessage}</p>
          {emptySubMessage && (
            <p className="text-sm text-gray-500 mt-2">{emptySubMessage}</p>
          )}
        </div>
      )}
    </section>
  );
};

const App: React.FC = () => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [detailedMedia, setDetailedMedia] = useState<
    MovieDetail | TVDetail | null
  >(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "discover" | "lists" | "recommendations"
  >("discover");
  const [recommendations, setRecommendations] = useState<SearchResult[]>([]);
  const [isRecsLoading, setIsRecsLoading] = useState(false);

  const [trending, setTrending] = useState<SearchResult[]>([]);
  const [popularMovies, setPopularMovies] = useState<SearchResult[]>([]);
  const [popularTV, setPopularTV] = useState<SearchResult[]>([]);
  const [isDiscoverLoading, setIsDiscoverLoading] = useState(false);
  const [animatingMedia, setAnimatingMedia] = useState<{
    media: Media;
    rect: DOMRect;
  } | null>(null);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage(
    "sidebarCollapsed",
    false
  );

  const watchlistIds = useMemo(
    () => new Set(watchlist.map((item) => item.id)),
    [watchlist]
  );

  useEffect(() => {
    const loadWatchlistFromDb = async () => {
      setIsDbLoading(true);
      try {
        const items = await dbService.getAllWatchlistItems();
        setWatchlist(items);
      } catch (err) {
        console.error("Failed to load watchlist from DB", err);
        setError("Could not load your watchlist. Please try refreshing.");
      } finally {
        setIsDbLoading(false);
      }
    };
    loadWatchlistFromDb();
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    setIsSearchLoading(true);
    setError(null);
    try {
      const results = await searchMedia(query);
      setSearchResults(results.filter((r) => r.poster_path)); // Filter out items without posters
    } catch (err) {
      setError("Failed to fetch search results. Please try again.");
      console.error(err);
    } finally {
      setIsSearchLoading(false);
    }
  }, []);

  const handleSelectMedia = useCallback(
    async (media: Media, rect: DOMRect) => {
      if (animatingMedia) return; // Prevent double clicks

      setAnimatingMedia({ media, rect });
      setSelectedMediaId(`${media.media_type}-${media.id}`);
      setError(null);
      setDetailedMedia(null); // Clear previous details
      try {
        let details: MovieDetail | TVDetail;
        if (media.media_type === "movie") {
          details = await getMovieDetails(media.id);
        } else {
          details = await getTVDetails(media.id);
        }
        setDetailedMedia(details);
      } catch (err) {
        setError("Failed to fetch media details.");
        console.error(err);
        setAnimatingMedia(null);
        setSelectedMediaId(null);
      }
    },
    [animatingMedia]
  );

  const handleCloseModal = () => {
    setSelectedMediaId(null);
    setDetailedMedia(null);
    setAnimatingMedia(null);
  };

  const handleToggleWatchlist = useCallback(
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

  const handleToggleWatchlistFromSearchResult = useCallback(
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
          await handleToggleWatchlist(details);
        } catch (err) {
          setError("Failed to add item to watchlist.");
          console.error(err);
        }
      }
    },
    [watchlistIds, handleToggleWatchlist]
  );

  const handleUpdateTags = useCallback(
    async (mediaId: number, newTags: string[]) => {
      const itemToUpdate = await dbService.getWatchlistItem(mediaId);
      if (itemToUpdate) {
        const updatedItem = { ...itemToUpdate, tags: newTags };
        await dbService.putWatchlistItem(updatedItem);
        setWatchlist((prev) =>
          prev.map((item) => (item.id === mediaId ? updatedItem : item))
        );
      }
    },
    []
  );

  const handleToggleMovieWatched = async (movieId: number) => {
    const itemToUpdate = watchlist.find(
      (item) => item.id === movieId && item.media_type === "movie"
    ) as MovieWatchlistItem | undefined;
    if (itemToUpdate) {
      const updatedItem = { ...itemToUpdate, watched: !itemToUpdate.watched };
      await dbService.putWatchlistItem(updatedItem);
      setWatchlist((prev) =>
        prev.map((item) => (item.id === movieId ? updatedItem : item))
      );
    }
  };

  const handleToggleEpisodeWatched = async (
    tvId: number,
    seasonNumber: number,
    episodeNumber: number
  ) => {
    const itemToUpdate = watchlist.find(
      (item) => item.id === tvId && item.media_type === "tv"
    ) as TVWatchlistItem | undefined;
    if (itemToUpdate) {
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
      await dbService.putWatchlistItem(updatedItem);
      setWatchlist((prev) =>
        prev.map((item) => (item.id === tvId ? updatedItem : item))
      );
    }
  };

  const handleToggleSeasonWatched = async (
    tvId: number,
    seasonNumber: number,
    allEpisodeNumbers: number[]
  ) => {
    const itemToUpdate = watchlist.find(
      (item) => item.id === tvId && item.media_type === "tv"
    ) as TVWatchlistItem | undefined;
    if (itemToUpdate) {
      const newWatchedEpisodes = { ...(itemToUpdate.watchedEpisodes || {}) };
      const seasonEpisodes = newWatchedEpisodes[seasonNumber] || [];

      if (seasonEpisodes.length === allEpisodeNumbers.length) {
        newWatchedEpisodes[seasonNumber] = []; // Unwatch all
      } else {
        newWatchedEpisodes[seasonNumber] = allEpisodeNumbers; // Watch all
      }

      const updatedItem = {
        ...itemToUpdate,
        watchedEpisodes: newWatchedEpisodes,
      };
      await dbService.putWatchlistItem(updatedItem);
      setWatchlist((prev) =>
        prev.map((item) => (item.id === tvId ? updatedItem : item))
      );
    }
  };

  const handleExportWatchlist = useCallback(async () => {
    try {
      const itemsToExport = await dbService.getAllWatchlistItems();
      const dataStr = JSON.stringify(itemsToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `scenestack_watchlist_${
        new Date().toISOString().split("T")[0]
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

  const handleImportWatchlist = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
          setWatchlist(importedData); // Update state to match DB
          setIsSettingsOpen(false);
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
    event.target.value = ""; // Reset for re-uploading
  };

  const allUniqueTags = useMemo(() => {
    const tags = new Set<string>();
    watchlist.forEach((item) => {
      item.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [watchlist]);

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
          // TV show
          // FIX: Operator '+' cannot be applied to types 'unknown' and 'number'. Using `|| {}` ensures `watchedEpisodes` is not undefined and helps TypeScript correctly infer `watchedCount` as a number.
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

  const progressMap = useMemo(() => {
    const map: Record<string, number> = {};
    currentlyWatchingItems.forEach((item) => {
      // FIX: Operator '+' cannot be applied to types 'unknown' and 'number'. Using `|| {}` ensures `watchedEpisodes` is not undefined and helps TypeScript correctly infer `watchedCount` as a number.
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

  const fetchRecommendations = useCallback(async () => {
    if (watchlist.length === 0) {
      setRecommendations([]);
      return;
    }
    setIsRecsLoading(true);
    setError(null);
    try {
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

      setRecommendations(Array.from(uniqueRecsMap.values()));
    } catch (err) {
      setError("Failed to fetch recommendations.");
      console.error(err);
    } finally {
      setIsRecsLoading(false);
    }
  }, [watchlist, watchlistIds]);

  useEffect(() => {
    const fetchDiscoverData = async () => {
      setIsDiscoverLoading(true);
      setError(null);
      try {
        const [trendingResults, popularMoviesResults, popularTVResults] =
          await Promise.all([
            getTrendingMedia(),
            getPopularMovies(),
            getPopularTVShows(),
          ]);
        setTrending(trendingResults.filter((r) => r.poster_path));
        setPopularMovies(popularMoviesResults.filter((r) => r.poster_path));
        setPopularTV(popularTVResults.filter((r) => r.poster_path));
      } catch (err) {
        setError("Failed to fetch discover content. Please try again later.");
        console.error(err);
      } finally {
        setIsDiscoverLoading(false);
      }
    };

    fetchDiscoverData();
  }, []);

  useEffect(() => {
    if (
      activeTab === "recommendations" &&
      recommendations.length === 0 &&
      watchlist.length > 0
    ) {
      fetchRecommendations();
    }
  }, [
    activeTab,
    recommendations.length,
    fetchRecommendations,
    watchlist.length,
  ]);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-light font-sans">
      <SideNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <div
        className={`transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <header className="sticky top-0 z-20 bg-brand-bg/80 backdrop-blur-lg">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Desktop Header */}
            <div className="hidden sm:flex w-full items-center justify-between">
              <div className="lg:hidden text-3xl font-black tracking-tighter text-white">
                Scene<span className="text-brand-secondary">Stack</span>
              </div>
              <div className="w-full max-w-sm flex items-center gap-2 ml-auto">
                <div className="flex-grow">
                  <SearchBar
                    onSearch={handleSearch}
                    isLoading={isSearchLoading}
                  />
                </div>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light hover:bg-brand-surface transition-colors flex-shrink-0"
                  aria-label="Open settings"
                >
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
            {/* Mobile Header */}
            <div className="flex sm:hidden w-full items-center justify-between">
              {isSearchExpanded ? (
                <div className="flex w-full items-center gap-2">
                  <button
                    onClick={() => setIsSearchExpanded(false)}
                    className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light"
                    aria-label="Close search"
                  >
                    <svg
                      className="h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <div className="flex-grow">
                    <SearchBar
                      onSearch={handleSearch}
                      isLoading={isSearchLoading}
                      isExpanded={isSearchExpanded}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-black tracking-tighter text-white">
                    Scene<span className="text-brand-secondary">Stack</span>
                  </h1>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsSearchExpanded(true)}
                      className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light"
                      aria-label="Open search"
                    >
                      <svg
                        className="h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setIsSettingsOpen(true)}
                      className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light hover:bg-brand-surface transition-colors flex-shrink-0"
                      aria-label="Open settings"
                    >
                      <svg
                        className="h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="pb-24 lg:pb-0">
          <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            {searchResults.length > 0 ? (
              <section>
                <h2 className="text-3xl font-bold mb-6 text-brand-text-light">
                  Search Results
                </h2>
                <MediaGrid
                  mediaItems={searchResults}
                  onCardClick={handleSelectMedia}
                  watchlistIds={watchlistIds}
                  selectedMediaId={selectedMediaId}
                />
              </section>
            ) : isDbLoading ? (
              <div className="text-center py-20 text-brand-text-dim">
                <p>Loading your watchlist...</p>
              </div>
            ) : (
              <>
                {activeTab === "discover" && (
                  <div>
                    {isDiscoverLoading ? (
                      <div className="text-center py-10">
                        <p>Loading discover content...</p>
                      </div>
                    ) : (
                      <div className="space-y-12">
                        {popularMovies.length > 0 && (
                          <Carousel
                            items={popularMovies.slice(0, 5)}
                            onViewDetails={handleSelectMedia}
                            onToggleWatchlist={
                              handleToggleWatchlistFromSearchResult
                            }
                            watchlistIds={watchlistIds}
                          />
                        )}
                        <MediaSection
                          title="Trending this week 🔥"
                          items={trending}
                          onCardClick={handleSelectMedia}
                          watchlistIds={watchlistIds}
                          emptyMessage="Could not load trending items."
                          selectedMediaId={selectedMediaId}
                        />
                        <MediaSection
                          title="Popular Movies 🎥"
                          items={popularMovies}
                          onCardClick={handleSelectMedia}
                          watchlistIds={watchlistIds}
                          emptyMessage="Could not load popular movies."
                          selectedMediaId={selectedMediaId}
                        />
                        <MediaSection
                          title="Popular TV Shows 📡"
                          items={popularTV}
                          onCardClick={handleSelectMedia}
                          watchlistIds={watchlistIds}
                          emptyMessage="Could not load popular TV shows."
                          selectedMediaId={selectedMediaId}
                        />
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "lists" && (
                  <>
                    {allUniqueTags.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-sm font-semibold uppercase tracking-widest text-brand-text-dim mb-3">
                          Filter by Tag
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setActiveTagFilter(null)}
                            className={`px-4 py-1 text-sm rounded-full transition-colors ${
                              !activeTagFilter
                                ? "bg-brand-primary text-white"
                                : "bg-brand-surface hover:bg-brand-surface/70 text-brand-text-light"
                            }`}
                          >
                            All
                          </button>
                          {allUniqueTags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => setActiveTagFilter(tag)}
                              className={`px-4 py-1 text-sm rounded-full transition-colors capitalize ${
                                activeTagFilter === tag
                                  ? "bg-brand-primary text-white"
                                  : "bg-brand-surface hover:bg-brand-surface/70 text-brand-text-light"
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="space-y-12">
                      <MediaSection
                        title="Currently Watching 🎦"
                        items={currentlyWatchingItems}
                        progressMap={progressMap}
                        onCardClick={handleSelectMedia}
                        watchlistIds={watchlistIds}
                        emptyMessage="Nothing is currently being watched."
                        selectedMediaId={selectedMediaId}
                      />
                      <MediaSection
                        title="My List 🗒"
                        items={watchlistItems}
                        onCardClick={handleSelectMedia}
                        watchlistIds={watchlistIds}
                        emptyMessage="Your list is empty."
                        emptySubMessage="Use the search bar to find movies and shows to add."
                        selectedMediaId={selectedMediaId}
                      />
                      <MediaSection
                        title="Watched ✅"
                        items={watchedItems}
                        onCardClick={handleSelectMedia}
                        watchlistIds={watchlistIds}
                        emptyMessage="You haven't marked any items as watched yet."
                        selectedMediaId={selectedMediaId}
                      />
                    </div>
                  </>
                )}

                {activeTab === "recommendations" && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-3xl font-bold text-brand-text-light">
                        For You
                      </h2>
                      <button
                        onClick={fetchRecommendations}
                        disabled={isRecsLoading || watchlist.length === 0}
                        className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light hover:bg-brand-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Refresh recommendations"
                      >
                        <svg
                          className={`h-5 w-5 ${
                            isRecsLoading ? "animate-spin" : ""
                          }`}
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h5M20 20v-5h-5M4 4a12 12 0 0117 4.1M20 20a12 12 0 01-17 -4.1"
                          />
                        </svg>
                      </button>
                    </div>
                    {isRecsLoading ? (
                      <div className="text-center py-10">
                        <p>Finding recommendations...</p>
                      </div>
                    ) : recommendations.length > 0 ? (
                      <MediaGrid
                        mediaItems={recommendations}
                        onCardClick={handleSelectMedia}
                        watchlistIds={watchlistIds}
                        selectedMediaId={selectedMediaId}
                      />
                    ) : (
                      <div className="text-center py-10 px-6 bg-brand-surface/50 rounded-lg">
                        <p className="text-brand-text-dim">
                          {watchlist.length > 0
                            ? "Could not generate recommendations. Try again."
                            : "Add items to your lists to get recommendations."}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {searchResults.length === 0 && (
        <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {animatingMedia && !detailedMedia && (
        <LoadingPosterAnimation
          media={animatingMedia.media}
          rect={animatingMedia.rect}
        />
      )}

      {detailedMedia && (
        <MediaDetailModal
          media={detailedMedia}
          watchlistIds={watchlistIds}
          onClose={handleCloseModal}
          onToggleWatchlist={handleToggleWatchlist}
          onToggleMovieWatched={handleToggleMovieWatched}
          onToggleEpisodeWatched={handleToggleEpisodeWatched}
          getSeasonDetails={getTVSeasonDetails}
          watchlistItem={watchlist.find((item) => item.id === detailedMedia.id)}
          onSearch={handleSearch}
          onToggleSeasonWatched={handleToggleSeasonWatched}
          onUpdateTags={handleUpdateTags}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onExport={handleExportWatchlist}
        onImport={handleImportWatchlist}
      />
    </div>
  );
};

export default App;
