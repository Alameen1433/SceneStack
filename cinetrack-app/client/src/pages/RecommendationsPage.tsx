import { useMemo, memo, useEffect } from "react";
import { useWatchlistStore, getWatchlistIds } from "../store/useWatchlistStore";
import { useUIContext } from "../contexts/UIContext";
import { MediaGrid } from "../components/media/MediaGrid";
import { MediaGridSkeleton } from "../components/common/MediaCardSkeleton";

export const RecommendationsPage: React.FC = memo(() => {
    const watchlist = useWatchlistStore(state => state.watchlist);
    const watchlistIds = useMemo(() => getWatchlistIds(watchlist), [watchlist]);
    const { handleSelectMedia, selectedMediaId } = useUIContext();

    const recommendations = useWatchlistStore(state => state.recommendations);
    const isLoading = useWatchlistStore(state => state.recommendationsLoading);
    const fetchRecommendations = useWatchlistStore(state => state.fetchRecommendations);

    useEffect(() => {
        if (recommendations.length === 0 && watchlist.length > 0) {
            fetchRecommendations();
        }
    }, [recommendations.length, watchlist.length, fetchRecommendations]);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-brand-text-light">For You</h2>
                <button
                    onClick={fetchRecommendations}
                    disabled={isLoading || watchlist.length === 0}
                    className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light hover:bg-brand-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Refresh recommendations"
                >
                    <svg
                        className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
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
            {isLoading ? (
                <MediaGridSkeleton count={12} />
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
    );
});

RecommendationsPage.displayName = "RecommendationsPage";
