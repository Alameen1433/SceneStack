import React, { memo } from "react";
import { useDiscoverContext } from "../contexts/DiscoverContext";
import { useWatchlistContext } from "../contexts/WatchlistContext";
import { useUIContext } from "../contexts/UIContext";
import { MediaSection } from "../components/common/MediaSection";
import { Carousel } from "../components/media/Carousal";

export const DiscoverPage: React.FC = memo(() => {
    const { trending, popularMovies, popularTV, isLoading } = useDiscoverContext();
    const { watchlistIds, toggleWatchlistFromSearchResult } = useWatchlistContext();
    const { handleSelectMedia, selectedMediaId } = useUIContext();

    if (isLoading) {
        return (
            <div className="text-center py-10">
                <p>Loading discover content...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {popularMovies.length > 0 && (
                <Carousel
                    items={popularMovies.slice(0, 5)}
                    onViewDetails={handleSelectMedia}
                    onToggleWatchlist={toggleWatchlistFromSearchResult}
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
    );
});

DiscoverPage.displayName = "DiscoverPage";
