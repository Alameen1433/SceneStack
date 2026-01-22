import React, { useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { useUIContext } from "../contexts/UIContext";
import { useWatchlistStore, getWatchlistIds } from "../store/useWatchlistStore";
import { MediaGrid } from "../components/media/MediaGrid";

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";

  const {
    searchResults,
    isSearchLoading,
    performSearch,
    setIsSearchLoading,
    handleSelectMedia,
    selectedMediaId,
    error,
  } = useUIContext();

  const watchlist = useWatchlistStore((state) => state.watchlist);
  const watchlistIds = useMemo(() => getWatchlistIds(watchlist), [watchlist]);

  useEffect(() => {
    if (query) {
      setIsSearchLoading(true);
      performSearch(query).finally(() => setIsSearchLoading(false));
    }
  }, [query, performSearch, setIsSearchLoading]);

  const handleBackToHome = () => {
    navigate("/");
  };

  if (isSearchLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-brand-primary/20 border-t-brand-primary animate-spin" />
        </div>
        <p className="text-brand-text-dim animate-pulse">Searching...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={handleBackToHome}
          className="px-4 py-2 rounded-xl bg-brand-surface hover:bg-brand-surface-alt text-white transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="text-center py-20 text-brand-text-dim">
        <p>Enter a search term to find movies and TV shows.</p>
      </div>
    );
  }

  if (searchResults.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-brand-text-dim mb-4">No results found for "{query}"</p>
        <button
          onClick={handleBackToHome}
          className="px-4 py-2 rounded-xl bg-brand-surface hover:bg-brand-surface-alt text-white transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <section>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleBackToHome}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-brand-text-dim hover:text-white hover:bg-white/10 transition-all"
        >
          <FiArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <div className="h-6 w-px bg-white/10" />
        <h2 className="text-xl font-bold text-white">
          Search Results
          <span className="ml-2 text-sm font-normal text-brand-text-dim">
            ({searchResults.length} found)
          </span>
        </h2>
      </div>
      <MediaGrid
        mediaItems={searchResults}
        onCardClick={handleSelectMedia}
        watchlistIds={watchlistIds}
        selectedMediaId={selectedMediaId}
      />
    </section>
  );
};

export default SearchResultsPage;
