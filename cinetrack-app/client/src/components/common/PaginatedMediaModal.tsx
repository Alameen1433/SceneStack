import React, { useState, useMemo, useCallback, useEffect } from "react";
import { MediaCard } from "../media/MediaCard";
import type { Media } from "../../types/types";

interface PaginatedMediaModalProps {
    title: string;
    items: Media[];
    onClose: () => void;
    onCardClick: (media: Media, rect: DOMRect) => void;
    watchlistIds: Set<number>;
    progressMap?: Record<string, number>;
    selectedMediaId: string | null;
}

const ITEMS_PER_PAGE = 24;

export const PaginatedMediaModal: React.FC<PaginatedMediaModalProps> = ({
    title,
    items,
    onClose,
    onCardClick,
    watchlistIds,
    progressMap,
    selectedMediaId,
}) => {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = useMemo(() => Math.ceil(items.length / ITEMS_PER_PAGE), [items.length]);

    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [items, currentPage]);

    const handlePrevPage = useCallback(() => {
        setCurrentPage((prev) => Math.max(1, prev - 1));
    }, []);

    const handleNextPage = useCallback(() => {
        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    }, [totalPages]);

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "ArrowLeft") {
                handlePrevPage();
            } else if (e.key === "ArrowRight") {
                handleNextPage();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose, handlePrevPage, handleNextPage]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-brand-bg/95 backdrop-blur-sm">
            {/* Header */}
            <header className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                        aria-label="Close"
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
                    <h2 className="text-xl sm:text-2xl font-bold text-brand-text-light">
                        {title}
                    </h2>
                    <span className="text-sm text-brand-text-dim">
                        ({items.length} items)
                    </span>
                </div>

                {/* Page indicator - desktop */}
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
                            {currentPage} / {totalPages}
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
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                    {paginatedItems.map((item) => (
                        <MediaCard
                            key={`${item.media_type}-${item.id}`}
                            media={item}
                            onClick={onCardClick}
                            isInWatchlist={watchlistIds.has(item.id)}
                            progress={progressMap ? progressMap[item.id] : undefined}
                            isDimmed={selectedMediaId === `${item.media_type}-${item.id}`}
                        />
                    ))}
                </div>
            </main>

            {/* Mobile pagination footer */}
            {totalPages > 1 && (
                <footer className="sm:hidden flex items-center justify-center gap-4 p-4 border-t border-white/10">
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
                    <span className="text-brand-text-light font-medium min-w-[60px] text-center">
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
