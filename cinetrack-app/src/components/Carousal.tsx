import React, { useState, useEffect, useCallback, useRef } from "react";
import { TMDB_IMAGE_BASE_URL } from "../constants";
import type { SearchResult } from "../types";
import { getMediaImages } from "../services/tmdbService";

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
    const [logos, setLogos] = useState<Record<number, string | null>>({});
    const timeoutRef = useRef<number | null>(null);

    const resetTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }, []);

    useEffect(() => {
        resetTimeout();
        timeoutRef.current = window.setTimeout(
            () => setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length),
            7000 // 7 seconds per slide
        );
        return () => resetTimeout();
    }, [currentIndex, items.length, resetTimeout]);

    useEffect(() => {
        if (items.length === 0) return;
        const currentItem = items[currentIndex];
        if (!currentItem || logos[currentItem.id] !== undefined) {
            return;
        }

        const fetchLogo = async () => {
            try {
                const imageInfo = await getMediaImages(
                    currentItem.id,
                    currentItem.media_type
                );
                const allLogos = imageInfo.logos;

                if (!allLogos || allLogos.length === 0) {
                    setLogos((prev) => ({ ...prev, [currentItem.id]: null }));
                    return;
                }

                let bestLogo = allLogos.find(
                    (l) => l.iso_639_1 === "en" && l.file_path.endsWith(".svg")
                );
                if (!bestLogo)
                    bestLogo = allLogos.find((l) => l.file_path.endsWith(".svg"));
                if (!bestLogo) bestLogo = allLogos.find((l) => l.iso_639_1 === "en");
                if (!bestLogo) bestLogo = allLogos[0];

                if (bestLogo) {
                    const logoUrl = `${TMDB_IMAGE_BASE_URL.replace("w500", "original")}${bestLogo.file_path
                        }`;
                    setLogos((prev) => ({ ...prev, [currentItem.id]: logoUrl }));
                } else {
                    setLogos((prev) => ({ ...prev, [currentItem.id]: null }));
                }
            } catch (error) {
                console.error(
                    `Failed to fetch logo for ${currentItem.title || currentItem.name}`,
                    error
                );
                setLogos((prev) => ({ ...prev, [currentItem.id]: null }));
            }
        };

        fetchLogo();
    }, [currentIndex, items, logos]);

    const goToPrevious = () => {
        setCurrentIndex(
            (prevIndex) => (prevIndex - 1 + items.length) % items.length
        );
    };

    const goToNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
    };

    const handleDotClick = (index: number) => {
        setCurrentIndex(index);
    };

    const viewDetailsButtonRef = useRef<HTMLButtonElement>(null);

    if (items.length === 0) {
        return null;
    }

    return (
        <section
            className="relative w-full aspect-video lg:aspect-[2.4/1] rounded-2xl overflow-hidden shadow-2xl"
            aria-roledescription="carousel"
        >
            <div className="w-full h-full">
                {items.map((item, index) => {
                    const isActive = index === currentIndex;
                    const backdropPath = item.backdrop_path
                        ? `${TMDB_IMAGE_BASE_URL.replace("w500", "original")}${item.backdrop_path
                        }`
                        : "";
                    const logoUrl = logos[item.id];

                    return (
                        <div
                            key={item.id}
                            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${isActive ? "opacity-100" : "opacity-0"
                                }`}
                            aria-hidden={!isActive}
                        >
                            {backdropPath && (
                                <img
                                    src={backdropPath}
                                    alt={`Backdrop for ${item.title || item.name}`}
                                    className="w-full h-full object-cover"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/70 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-bg/50 to-transparent" />

                            <div className="absolute bottom-0 left-0 p-4 md:p-10 lg:p-12 w-full md:w-3/5 lg:w-1/2">
                                {logoUrl ? (
                                    <img
                                        src={logoUrl}
                                        alt={`${item.title || item.name} logo`}
                                        className="max-h-16 md:max-h-24 w-auto object-contain self-start drop-shadow-lg"
                                    />
                                ) : (
                                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white drop-shadow-lg leading-tight">
                                        {item.title || item.name}
                                    </h2>
                                )}
                                <p className="mt-2 md:mt-4 text-sm md:text-base text-brand-text-light/90 drop-shadow-md max-h-16 sm:max-h-24 overflow-y-hidden">
                                    {item.overview}
                                </p>
                                <div className="mt-4 md:mt-6 flex items-center gap-4">
                                    <button
                                        ref={viewDetailsButtonRef}
                                        onClick={() =>
                                            viewDetailsButtonRef.current &&
                                            onViewDetails(
                                                item,
                                                viewDetailsButtonRef.current.getBoundingClientRect()
                                            )
                                        }
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
                                        onClick={() => onToggleWatchlist(item)}
                                        className="bg-black/40 backdrop-blur-sm hover:bg-white/20 text-white font-bold p-3 rounded-full transition-colors"
                                        aria-label={
                                            watchlistIds.has(item.id)
                                                ? "Remove from watchlist"
                                                : "Add to watchlist"
                                        }
                                        title={
                                            watchlistIds.has(item.id)
                                                ? "Remove from watchlist"
                                                : "Add to watchlist"
                                        }
                                    >
                                        {watchlistIds.has(item.id) ? (
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
                        </div>
                    );
                })}
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white transition-colors z-10"
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
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white transition-colors z-10"
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

            {/* Navigation Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {items.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => handleDotClick(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${currentIndex === index
                                ? "bg-white"
                                : "bg-white/40 hover:bg-white/70"
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    );
};
