import React, { useRef, useState, useCallback, useEffect, memo } from "react";
import { MediaCard } from "../media/MediaCard";
import type { Media } from "../../types/types";

interface HorizontalMediaScrollProps {
    title: string;
    items: Media[];
    onCardClick: (media: Media, rect: DOMRect) => void;
    watchlistIds: Set<number>;
    progressMap?: Record<string, number>;
    emptyMessage: string;
    selectedMediaId: string | null;
}

export const HorizontalMediaScroll: React.FC<HorizontalMediaScrollProps> = memo(({
    title,
    items,
    onCardClick,
    watchlistIds,
    progressMap,
    emptyMessage,
    selectedMediaId,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    // Check if arrows should be visible
    const updateArrowVisibility = useCallback(() => {
        const container = scrollRef.current;
        if (!container) return;

        const { scrollLeft, scrollWidth, clientWidth } = container;
        setShowLeftArrow(scrollLeft > 10);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }, []);

    // Monitor scroll position and container size
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        updateArrowVisibility();
        container.addEventListener("scroll", updateArrowVisibility);
        window.addEventListener("resize", updateArrowVisibility);

        return () => {
            container.removeEventListener("scroll", updateArrowVisibility);
            window.removeEventListener("resize", updateArrowVisibility);
        };
    }, [updateArrowVisibility, items.length]);

    // Scroll by a set amount
    const scroll = useCallback((direction: "left" | "right") => {
        const container = scrollRef.current;
        if (!container) return;

        const scrollAmount = container.clientWidth * 0.75;
        container.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    }, []);

    if (items.length === 0) {
        return (
            <section>
                <h2 className="text-3xl font-bold mb-6 text-brand-text-light">{title}</h2>
                <div className="text-center py-10 px-6 bg-brand-surface/50 rounded-lg">
                    <p className="text-brand-text-dim">{emptyMessage}</p>
                </div>
            </section>
        );
    }

    return (
        <section>
            <h2 className="text-3xl font-bold mb-6 text-brand-text-light">{title}</h2>

            {/* Scroll container wrapper - overflow hidden to clip arrows */}
            <div className="relative group/scroll overflow-hidden -mx-4 sm:-mx-6">
                {/* Left Arrow - always visible on mobile for touch hint */}
                <button
                    onClick={() => scroll("left")}
                    className={`absolute left-0 top-0 bottom-0 z-10 w-12 sm:w-16
                        flex items-center justify-center
                        transition-opacity duration-200
                        ${showLeftArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    style={{
                        background: 'linear-gradient(to right, #0D0C11 0%, #0D0C11 30%, transparent 100%)',
                    }}
                    aria-label="Scroll left"
                >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 sm:h-6 sm:w-6 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </div>
                </button>

                {/* Scrollable Container */}
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto scroll-smooth pb-2 px-4 sm:px-6"
                    style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                    }}
                >
                    {items.map((item) => (
                        <div
                            key={`${item.media_type}-${item.id}`}
                            className="flex-shrink-0 w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.75rem)] md:w-[calc(25%-0.75rem)] lg:w-[calc(20%-0.8rem)] xl:w-[calc(16.666%-0.833rem)]"
                        >
                            <MediaCard
                                media={item}
                                onClick={onCardClick}
                                isInWatchlist={watchlistIds.has(item.id)}
                                progress={progressMap ? progressMap[item.id] : undefined}
                                isDimmed={selectedMediaId === `${item.media_type}-${item.id}`}
                            />
                        </div>
                    ))}
                </div>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll("right")}
                    className={`absolute right-0 top-0 bottom-0 z-10 w-12 sm:w-16
                        flex items-center justify-center
                        transition-opacity duration-200
                        ${showRightArrow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    style={{
                        background: 'linear-gradient(to left, #0D0C11 0%, #0D0C11 30%, transparent 100%)',
                    }}
                    aria-label="Scroll right"
                >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 sm:h-6 sm:w-6 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </button>
            </div>

            {/* Hide scrollbar CSS */}
            <style>{`
                div::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </section>
    );
});

HorizontalMediaScroll.displayName = "HorizontalMediaScroll";


