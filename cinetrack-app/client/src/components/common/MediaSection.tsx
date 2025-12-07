import React, { useState, memo } from "react";
import { MediaGrid } from "../media/MediaGrid";
import type { Media } from "../../types/types";

interface MediaSectionProps {
    title: string;
    items: Media[];
    onCardClick: (media: Media, rect: DOMRect) => void;
    watchlistIds: Set<number>;
    progressMap?: Record<string, number>;
    emptyMessage: string;
    emptySubMessage?: string;
    selectedMediaId: string | null;
}

export const MediaSection: React.FC<MediaSectionProps> = memo(({
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
});

MediaSection.displayName = "MediaSection";
