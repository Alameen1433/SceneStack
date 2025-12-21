import React, { useState, memo, useMemo, useCallback, useEffect } from "react";
import { MediaCard } from "../media/MediaCard";
import { ShowMoreCard } from "./ShowMoreCard";
import { useUIContext } from "../../contexts/UIContext";
import type { Media } from "../../types/types";
import type { WatchlistStatus } from "../../services/dbService";

interface MediaSectionProps {
    title: string;
    items: Media[];
    onCardClick: (media: Media, rect: DOMRect) => void;
    watchlistIds: Set<number>;
    progressMap?: Record<string, number>;
    emptyMessage: string;
    emptySubMessage?: string;
    selectedMediaId: string | null;
    enablePagination?: boolean;
    status?: WatchlistStatus;
}

// Responsive breakpoints matching Tailwind's grid columns
// grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
const getColumnsForWidth = (width: number): number => {
    if (width >= 1280) return 6; // xl
    if (width >= 1024) return 5; // lg
    if (width >= 768) return 4;  // md
    if (width >= 640) return 3;  // sm
    return 2;                     // default
};

// Rows to show: 2 for mobile, 3 for larger screens (pagination mode)
const getRowsForWidth = (width: number): number => {
    return width >= 640 ? 3 : 2;
};

// Rows to show for expand mode (Discover): always 3 rows
const EXPAND_MODE_ROWS = 3;

export const MediaSection: React.FC<MediaSectionProps> = memo(({
    title,
    items,
    onCardClick,
    watchlistIds,
    progressMap,
    emptyMessage,
    emptySubMessage,
    selectedMediaId,
    enablePagination = false,
    status,
}) => {
    const { openViewAll } = useUIContext();
    const [isExpanded, setIsExpanded] = useState(false);
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : 1024
    );

    // Track window width for responsive calculations
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const columns = useMemo(() => getColumnsForWidth(windowWidth), [windowWidth]);
    const rows = useMemo(() => getRowsForWidth(windowWidth), [windowWidth]);

    // Calculate items to show based on mode
    const maxVisibleItems = useMemo(() => columns * rows, [columns, rows]);

    const { displayedItems, hasMoreItems, remainingCount } = useMemo(() => {
        if (enablePagination) {
            // Pagination mode: show limited rows with ShowMoreCard
            const hasMore = items.length > maxVisibleItems;
            const itemsToShow = hasMore ? maxVisibleItems - 1 : items.length;
            return {
                displayedItems: items.slice(0, itemsToShow),
                hasMoreItems: hasMore,
                remainingCount: items.length - itemsToShow,
            };
        } else {
            // Expand mode: show 3 rows based on viewport with expand button
            const expandModeItems = columns * EXPAND_MODE_ROWS;
            const hasMore = items.length > expandModeItems;
            return {
                displayedItems: isExpanded ? items : items.slice(0, expandModeItems),
                hasMoreItems: hasMore,
                remainingCount: items.length - expandModeItems,
            };
        }
    }, [enablePagination, items, maxVisibleItems, isExpanded, columns]);

    const handleViewAll = useCallback(() => {
        openViewAll(title, items, status);
    }, [openViewAll, title, items, status]);

    const handleToggleExpand = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    return (
        <section>
            <h2 className="text-3xl font-bold mb-6 text-brand-text-light">{title}</h2>
            {items.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                        {displayedItems.map((item) => (
                            <MediaCard
                                key={`${item.media_type}-${item.id}`}
                                media={item}
                                onClick={onCardClick}
                                isInWatchlist={watchlistIds.has(item.id)}
                                progress={progressMap ? progressMap[item.id] : undefined}
                                isDimmed={selectedMediaId === `${item.media_type}-${item.id}`}
                            />
                        ))}
                        {/* Pagination mode: Show arrow card inline */}
                        {enablePagination && hasMoreItems && (
                            <ShowMoreCard
                                remainingCount={remainingCount}
                                onClick={handleViewAll}
                            />
                        )}
                    </div>
                    {/* Expand mode: Show More/Less button below grid */}
                    {!enablePagination && hasMoreItems && (
                        <div className="text-center mt-8">
                            <button
                                onClick={handleToggleExpand}
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

