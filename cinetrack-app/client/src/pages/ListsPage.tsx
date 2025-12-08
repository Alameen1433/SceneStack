import React, { memo } from "react";
import { useWatchlistContext } from "../contexts/WatchlistContext";
import { useUIContext } from "../contexts/UIContext";
import { MediaSection } from "../components/common/MediaSection";
import { HorizontalMediaScroll } from "../components/common/HorizontalMediaScroll";

export const ListsPage: React.FC = memo(() => {
    const {
        watchlistIds,
        watchlistItems,
        currentlyWatchingItems,
        watchedItems,
        progressMap,
        allUniqueTags,
        activeTagFilter,
        setActiveTagFilter,
    } = useWatchlistContext();
    const { handleSelectMedia, selectedMediaId } = useUIContext();

    return (
        <>
            {allUniqueTags.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-brand-text-dim mb-3">
                        Filter by Tag
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setActiveTagFilter(null)}
                            className={`px-4 py-1 text-sm rounded-full transition-colors ${!activeTagFilter
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
                                className={`px-4 py-1 text-sm rounded-full transition-colors capitalize ${activeTagFilter === tag
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
                {/* Currently Watching - Horizontal scroll */}
                <HorizontalMediaScroll
                    title="Currently Watching 🎦"
                    items={currentlyWatchingItems}
                    progressMap={progressMap}
                    onCardClick={handleSelectMedia}
                    watchlistIds={watchlistIds}
                    emptyMessage="Nothing is currently being watched."
                    selectedMediaId={selectedMediaId}
                />
                {/* My List - Pagination */}
                <MediaSection
                    title="My List 🗒"
                    items={watchlistItems}
                    onCardClick={handleSelectMedia}
                    watchlistIds={watchlistIds}
                    emptyMessage="Your list is empty."
                    emptySubMessage="Use the search bar to find movies and shows to add."
                    selectedMediaId={selectedMediaId}
                    enablePagination
                />
                {/* Watched - Pagination */}
                <MediaSection
                    title="Watched ✅"
                    items={watchedItems}
                    onCardClick={handleSelectMedia}
                    watchlistIds={watchlistIds}
                    emptyMessage="You haven't marked any items as watched yet."
                    selectedMediaId={selectedMediaId}
                    enablePagination
                />
            </div>
        </>
    );
});

ListsPage.displayName = "ListsPage";

