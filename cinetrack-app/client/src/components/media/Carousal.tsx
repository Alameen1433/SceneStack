import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { TMDB_IMAGE_BASE_URL } from "../../constants/constants";
import type { SearchResult } from "../../types/types";
import { getMediaImages } from "../../services/tmdbService";
import { selectBestLogo, getLogoUrl } from "../../utils/logoHelpers";

interface CarouselProps {
    items: SearchResult[];
    onViewDetails: (media: SearchResult, rect: DOMRect) => void;
    onToggleWatchlist: (media: SearchResult) => void;
    watchlistIds: Set<number>;
}

export const Carousel: React.FC<CarouselProps> = ({
    items,
    onViewDetails,
    onToggleWatchlist,
    watchlistIds,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [logoUrls, setLogoUrls] = useState<Record<number, string | null>>({});
    const [isTransitioning, setIsTransitioning] = useState(false);
    const autoPlayRef = useRef<number | null>(null);
    const detailsButtonRef = useRef<HTMLButtonElement>(null);
    const currentItem = useMemo(() => items[currentIndex], [items, currentIndex]);
    const stopAutoPlay = useCallback(() => {
        if (autoPlayRef.current) {
            clearTimeout(autoPlayRef.current);
            autoPlayRef.current = null;
        }
    }, []);

    const startAutoPlay = useCallback(() => {
        stopAutoPlay();
        autoPlayRef.current = window.setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 7000);
    }, [items.length, stopAutoPlay]);

    useEffect(() => {
        if (items.length > 1) {
            startAutoPlay();
        }
        return stopAutoPlay;
    }, [items.length, currentIndex, startAutoPlay, stopAutoPlay]);

    // Fetch logo for current item
    useEffect(() => {
        if (!currentItem || logoUrls[currentItem.id] !== undefined) {
            return;
        }

        const fetchLogo = async () => {
            try {
                const imageInfo = await getMediaImages(currentItem.id, currentItem.media_type);
                const bestLogo = selectBestLogo(imageInfo.logos);
                const url = getLogoUrl(bestLogo);
                setLogoUrls((prev) => ({ ...prev, [currentItem.id]: url || null }));
            } catch (error) {
                console.error(`Failed to fetch logo for ${currentItem.title || currentItem.name}`, error);
                setLogoUrls((prev) => ({ ...prev, [currentItem.id]: null }));
            }
        };

        fetchLogo();
    }, [currentItem, logoUrls]);

    // Navigation
    const goToPrevious = useCallback(() => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
        setTimeout(() => setIsTransitioning(false), 500);
    }, [items.length, isTransitioning]);

    const goToNext = useCallback(() => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => (prev + 1) % items.length);
        setTimeout(() => setIsTransitioning(false), 500);
    }, [items.length, isTransitioning]);

    const goToIndex = useCallback((index: number) => {
        if (isTransitioning || index === currentIndex) return;
        setIsTransitioning(true);
        setCurrentIndex(index);
        setTimeout(() => setIsTransitioning(false), 500);
    }, [currentIndex, isTransitioning]);

    // Button click handlers
    const handleViewDetails = useCallback(() => {
        if (detailsButtonRef.current && currentItem) {
            onViewDetails(currentItem, detailsButtonRef.current.getBoundingClientRect());
        }
    }, [currentItem, onViewDetails]);

    const handleToggleWatchlist = useCallback(() => {
        if (currentItem) {
            onToggleWatchlist(currentItem);
        }
    }, [currentItem, onToggleWatchlist]);

    // Don't render if no items
    if (items.length === 0 || !currentItem) {
        return null;
    }

    const backdropUrl = currentItem.backdrop_path
        ? `${TMDB_IMAGE_BASE_URL.replace("w500", "original")}${currentItem.backdrop_path}`
        : "";
    const logoUrl = logoUrls[currentItem.id];
    const isInWatchlist = watchlistIds.has(currentItem.id);
    const title = currentItem.title || currentItem.name;

    return (
        <section
            className="relative w-full aspect-[1/1] sm:aspect-video lg:aspect-[2.4/1] rounded-2xl overflow-hidden shadow-2xl"
            aria-roledescription="carousel"
            aria-label="Featured content"
        >
            {/* Background Image */}
            <div className="absolute inset-0 w-full h-full">
                {backdropUrl && (
                    <img
                        key={currentItem.id}
                        src={backdropUrl}
                        alt={`Backdrop for ${title}`}
                        className="w-full h-full object-cover animate-fade-in"
                    />
                )}
                {/* Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/70 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-bg/50 to-transparent" />
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 p-4 md:p-10 lg:p-12 w-full md:w-3/5 lg:w-1/2 z-10">
                {/* Logo or Title */}
                {logoUrl ? (
                    <img
                        key={`logo-${currentItem.id}`}
                        src={logoUrl}
                        alt={`${title} logo`}
                        className="max-h-16 md:max-h-24 w-auto object-contain drop-shadow-lg animate-fade-in"
                    />
                ) : (
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white drop-shadow-lg leading-tight">
                        {title}
                    </h2>
                )}

                {/* Overview */}
                <p className="mt-2 md:mt-4 text-sm md:text-base text-brand-text-light/90 drop-shadow-md max-h-16 sm:max-h-24 overflow-hidden line-clamp-3">
                    {currentItem.overview}
                </p>

                {/* Action Buttons */}
                <div className="mt-4 md:mt-6 flex items-center gap-4">
                    <button
                        ref={detailsButtonRef}
                        onClick={handleViewDetails}
                        className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-6 rounded-full transition-colors flex items-center gap-2"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        More Info
                    </button>

                    <button
                        onClick={handleToggleWatchlist}
                        className="bg-black/40 backdrop-blur-sm hover:bg-white/20 text-white font-bold p-3 rounded-full transition-colors"
                        aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                        title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                    >
                        {isInWatchlist ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Navigation Arrows */}
            {items.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white transition-colors z-20"
                        aria-label="Previous slide"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                    </button>

                    <button
                        onClick={goToNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white transition-colors z-20"
                        aria-label="Next slide"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </button>
                </>
            )}

            {/* Navigation Dots */}
            {items.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {items.map((item, index) => (
                        <button
                            key={item.id}
                            onClick={() => goToIndex(index)}
                            className={`w-2.5 h-2.5 rounded-full transition-colors ${currentIndex === index
                                    ? "bg-white"
                                    : "bg-white/40 hover:bg-white/70"
                                }`}
                            aria-label={`Go to slide ${index + 1}: ${item.title || item.name}`}
                            aria-current={currentIndex === index ? "true" : undefined}
                        />
                    ))}
                </div>
            )}

            {/* CSS Animation */}
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
      `}</style>
        </section>
    );
};
