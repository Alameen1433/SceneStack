import { useMemo, memo } from "react";
import { useDiscoverContext } from "../contexts/DiscoverContext";
import { useWatchlistStore, getWatchlistIds } from "../store/useWatchlistStore";
import { useUIContext } from "../contexts/UIContext";
import { MediaSection } from "../components/common/MediaSection";
import { Carousel } from "../components/media/Carousal";
import { MediaGridSkeleton } from "../components/common/MediaCardSkeleton";

export const DiscoverPage: React.FC = memo(() => {
    const { trending, popularMovies, popularTV, isLoading } = useDiscoverContext();
    const watchlist = useWatchlistStore(state => state.watchlist);
    const watchlistIds = useMemo(() => getWatchlistIds(watchlist), [watchlist]);
    const toggleWatchlistFromSearchResult = useWatchlistStore(state => state.toggleWatchlistFromSearchResult);
    const { handleSelectMedia, selectedMediaId } = useUIContext();

    if (isLoading) {
        return (
            <div className="space-y-12">
                {/* Hero skeleton */}
                <div className="relative h-[50vh] min-h-[400px] max-h-[600px] rounded-2xl overflow-hidden bg-brand-surface">
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-brand-surface via-white/5 to-brand-surface bg-[length:200%_100%]" />
                </div>
                {/* Section skeletons */}
                <div>
                    <div className="h-7 w-48 mb-4 rounded bg-brand-surface animate-pulse" />
                    <MediaGridSkeleton count={6} />
                </div>
                <div>
                    <div className="h-7 w-40 mb-4 rounded bg-brand-surface animate-pulse" />
                    <MediaGridSkeleton count={6} />
                </div>
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
