import React, { useState, useMemo, useCallback, useEffect } from "react";
import { MediaCard } from "../components/media/MediaCard";
import { useWatchlistContext } from "../contexts/WatchlistContext";
import { useUIContext } from "../contexts/UIContext";
import type { Media } from "../types/types";

const ITEMS_PER_PAGE = 20;

interface ViewAllPageProps {
    title: string;
    items: Media[];
    onClose: () => void;
}

export const ViewAllPage: React.FC<ViewAllPageProps> = ({
    title,
    items,
    onClose,
}) => {
    const { watchlistIds, progressMap } = useWatchlistContext();
    const { handleSelectMedia, selectedMediaId } = useUIContext();
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = useMemo(() => Math.ceil(items.length / ITEMS_PER_PAGE), [items.length]);

    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [items, currentPage]);

    const handlePrevPage = useCallback(() => {
        setCurrentPage((prev) => Math.max(1, prev - 1));
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const handleNextPage = useCallback(() => {
        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [totalPages]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "ArrowLeft" && currentPage > 1) {
                handlePrevPage();
            } else if (e.key === "ArrowRight" && currentPage < totalPages) {
                handleNextPage();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose, currentPage, totalPages, handlePrevPage, handleNextPage]);

    return (
        <div className="min-h-screen pb-8">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-brand-bg/95 backdrop-blur-sm border-b border-white/10 mb-6">
                <div className="flex items-center justify-between px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                            aria-label="Go back"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 text-brand-text-light"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-brand-text-light">
                                {title}
                            </h1>
                            <p className="text-sm text-brand-text-dim">
                                {items.length} items
                            </p>
                        </div>
                    </div>

                    {/* Desktop pagination controls */}
                    {totalPages > 1 && (
                        <div className="hidden sm:flex items-center gap-3">
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Previous page"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-brand-text-light"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <span className="text-brand-text-light font-medium min-w-[80px] text-center">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Next page"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-brand-text-light"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Grid content */}
            <main className="px-4 sm:px-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                    {paginatedItems.map((item) => (
                        <MediaCard
                            key={`${item.media_type}-${item.id}`}
                            media={item}
                            onClick={handleSelectMedia}
                            isInWatchlist={watchlistIds.has(item.id)}
                            progress={progressMap ? progressMap[item.id] : undefined}
                            isDimmed={selectedMediaId === `${item.media_type}-${item.id}`}
                        />
                    ))}
                </div>
            </main>

            {/* Mobile pagination footer */}
            {totalPages > 1 && (
                <footer className="sm:hidden fixed bottom-0 left-0 right-0 flex items-center justify-center gap-4 p-4 bg-brand-bg/95 backdrop-blur-sm border-t border-white/10"
                    style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
                >
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-surface hover:bg-brand-primary/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-brand-text-light"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-brand-text-light font-medium">Prev</span>
                    </button>
                    <span className="text-brand-text-light font-medium min-w-[80px] text-center">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-surface hover:bg-brand-primary/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <span className="text-brand-text-light font-medium">Next</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-brand-text-light"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </footer>
            )}
        </div>
    );
};
