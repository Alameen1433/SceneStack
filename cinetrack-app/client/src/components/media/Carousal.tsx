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

// Global logo cache to persist across re-renders and component unmounts
const logoCache = new Map<number, string | null>();

export const Carousel: React.FC<CarouselProps> = ({
    items,
    onViewDetails,
    onToggleWatchlist,
    watchlistIds,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [logoUrls, setLogoUrls] = useState<Record<number, string | null>>(() => {
        const initial: Record<number, string | null> = {};
        items.forEach(item => {
            if (logoCache.has(item.id)) {
                initial[item.id] = logoCache.get(item.id)!;
            }
        });
        return initial;
    });
    const [isTransitioning, setIsTransitioning] = useState(false);

    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const containerRef = useRef<HTMLElement>(null);
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
        }, 5000);
    }, [items.length, stopAutoPlay]);

    useEffect(() => {
        if (items.length > 1) startAutoPlay();
        return stopAutoPlay;
    }, [items.length, currentIndex, startAutoPlay, stopAutoPlay]);

    useEffect(() => {
        const fetchLogos = async () => {
            for (const item of items) {
                if (logoCache.has(item.id)) continue;

                try {
                    const imageInfo = await getMediaImages(item.id, item.media_type);
                    const bestLogo = selectBestLogo(imageInfo.logos);
                    const url = getLogoUrl(bestLogo) || null;
                    logoCache.set(item.id, url);
                    setLogoUrls(prev => ({ ...prev, [item.id]: url }));
                } catch {
                    logoCache.set(item.id, null);
                    setLogoUrls(prev => ({ ...prev, [item.id]: null }));
                }
            }
        };

        fetchLogos();
    }, []);

    const goToPrevious = useCallback(() => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
        setTimeout(() => setIsTransitioning(false), 400);
    }, [items.length, isTransitioning]);

    const goToNext = useCallback(() => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex((prev) => (prev + 1) % items.length);
        setTimeout(() => setIsTransitioning(false), 400);
    }, [items.length, isTransitioning]);

    const goToIndex = useCallback((index: number) => {
        if (isTransitioning || index === currentIndex) return;
        setIsTransitioning(true);
        setCurrentIndex(index);
        setTimeout(() => setIsTransitioning(false), 400);
    }, [currentIndex, isTransitioning]);

    // Touch handlers
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        stopAutoPlay();
        touchStartX.current = e.touches[0].clientX;
        touchEndX.current = e.touches[0].clientX;
    }, [stopAutoPlay]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    }, []);

    const handleTouchEnd = useCallback(() => {
        const diff = touchStartX.current - touchEndX.current;
        const threshold = 50;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                goToNext();
            } else {
                goToPrevious();
            }
        }
        startAutoPlay();
    }, [goToNext, goToPrevious, startAutoPlay]);

    // Click handlers
    const handleViewDetails = useCallback(() => {
        if (detailsButtonRef.current && currentItem) {
            onViewDetails(currentItem, detailsButtonRef.current.getBoundingClientRect());
        }
    }, [currentItem, onViewDetails]);

    const handleToggleWatchlist = useCallback(() => {
        if (currentItem) onToggleWatchlist(currentItem);
    }, [currentItem, onToggleWatchlist]);

    if (items.length === 0 || !currentItem) return null;
    const logoUrl = logoUrls[currentItem.id];
    const isInWatchlist = watchlistIds.has(currentItem.id);
    const title = currentItem.title || currentItem.name;

    return (
        <section
            ref={containerRef}
            className="relative w-full aspect-[1/1] sm:aspect-video lg:aspect-[2.4/1] rounded-2xl overflow-hidden shadow-2xl select-none"
            aria-roledescription="carousel"
            aria-label="Featured content"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Background with crossfade */}
            <div className="absolute inset-0">
                {items.map((item, index) => {
                    const url = item.backdrop_path
                        ? `${TMDB_IMAGE_BASE_URL.replace("w500", "original")}${item.backdrop_path}`
                        : "";
                    return (
                        <div
                            key={item.id}
                            className={`absolute inset-0 transition-opacity duration-500 ${index === currentIndex ? "opacity-100" : "opacity-0"
                                }`}
                        >
                            {url && (
                                <img
                                    src={url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    loading={index < 2 ? "eager" : "lazy"}
                                />
                            )}
                        </div>
                    );
                })}

                {/* Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-bg/80 via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 p-5 md:p-10 lg:p-12 w-full md:w-3/5 lg:w-1/2 z-10">
                {/* Logo or Title */}
                <div className={`transition-all duration-300 ${isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={`${title} logo`}
                            className="max-h-14 md:max-h-20 lg:max-h-24 w-auto object-contain drop-shadow-lg"
                        />
                    ) : (
                        <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white drop-shadow-lg leading-tight">
                            {title}
                        </h2>
                    )}

                    {/* Overview */}
                    <p className="mt-3 md:mt-4 text-sm md:text-base text-white/80 line-clamp-2 md:line-clamp-3 max-w-lg">
                        {currentItem.overview}
                    </p>

                    {/* Action Buttons */}
                    <div className="mt-4 md:mt-6 flex items-center gap-3">
                        <button
                            ref={detailsButtonRef}
                            onClick={handleViewDetails}
                            className="bg-brand-primary text-brand-bg font-semibold py-2.5 px-5 md:px-6 rounded-lg transition-all hover:bg-brand-secondary hover:scale-105 active:scale-95 flex items-center gap-2 text-sm md:text-base shadow-lg shadow-brand-primary/20"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            More Info
                        </button>

                        <button
                            onClick={handleToggleWatchlist}
                            className={`p-2.5 md:p-3 rounded-lg transition-all hover:scale-110 active:scale-95 ${isInWatchlist
                                ? "bg-brand-primary text-brand-bg"
                                : "bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                                }`}
                            aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                        >
                            {isInWatchlist ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Arrows - Hidden on touch devices */}
            {items.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white transition-all hover:scale-110 z-20"
                        aria-label="Previous"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={goToNext}
                        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white transition-all hover:scale-110 z-20"
                        aria-label="Next"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </>
            )}

            {/* Dots */}
            {items.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                    {items.map((item, index) => (
                        <button
                            key={item.id}
                            onClick={() => goToIndex(index)}
                            className={`h-1.5 rounded-full transition-all ${currentIndex === index
                                ? "w-6 bg-white"
                                : "w-1.5 bg-white/40 hover:bg-white/60"
                                }`}
                            aria-label={`Slide ${index + 1}`}
                            aria-current={currentIndex === index ? "true" : undefined}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};
