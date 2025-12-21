import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { MediaCard } from "../components/media/MediaCard";
import { useWatchlistIds, useProgressMap } from "../contexts/WatchlistContext";
import { useUIContext } from "../contexts/UIContext";
import type { Media, WatchlistItem } from "../types/types";
import type { WatchlistStatus } from "../services/dbService";
import { getWatchlistByStatus } from "../services/dbService";
import { FiArrowLeft, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const ITEMS_PER_PAGE_MOBILE = 20;
const ITEMS_PER_PAGE_DESKTOP = 24;
const MAX_CACHED_PAGES = 3;

interface ViewAllPageProps {
    title: string;
    items: Media[];
    status?: WatchlistStatus;
    onClose: () => void;
}

export const ViewAllPage: React.FC<ViewAllPageProps> = ({
    title,
    items: initialItems,
    status,
    onClose,
}) => {
    const watchlistIds = useWatchlistIds();
    const progressMap = useProgressMap();
    const { handleSelectMedia, selectedMediaId } = useUIContext();
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : 1024
    );

    const pageCache = useRef<Map<number, WatchlistItem[]>>(new Map());
    const pageOrder = useRef<number[]>([]);
    const [displayItems, setDisplayItems] = useState<Media[]>(initialItems);
    const [totalItems, setTotalItems] = useState(initialItems.length);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const itemsPerPage = useMemo(() =>
        windowWidth >= 640 ? ITEMS_PER_PAGE_DESKTOP : ITEMS_PER_PAGE_MOBILE
        , [windowWidth]);

    const totalPages = useMemo(() => {
        if (!status) return Math.ceil(initialItems.length / itemsPerPage);
        return Math.ceil(totalItems / itemsPerPage);
    }, [status, initialItems.length, itemsPerPage, totalItems]);

    const addToCache = useCallback((page: number, items: WatchlistItem[]) => {
        if (pageCache.current.has(page)) {
            pageOrder.current = pageOrder.current.filter(p => p !== page);
        }
        pageCache.current.set(page, items);
        pageOrder.current.push(page);

        while (pageOrder.current.length > MAX_CACHED_PAGES) {
            const oldestPage = pageOrder.current.shift();
            if (oldestPage !== undefined) {
                pageCache.current.delete(oldestPage);
            }
        }
    }, []);

    const fetchPage = useCallback(async (page: number) => {
        if (!status) return;

        if (pageCache.current.has(page)) {
            setDisplayItems(pageCache.current.get(page) || []);
            return;
        }

        setIsLoading(true);
        try {
            const response = await getWatchlistByStatus(status, page, itemsPerPage);
            addToCache(page, response.items);
            setDisplayItems(response.items);
            setTotalItems(response.totalCount);
        } catch (err) {
            console.error("Failed to fetch page:", err);
        } finally {
            setIsLoading(false);
        }
    }, [status, itemsPerPage, addToCache]);

    useEffect(() => {
        if (status) {
            fetchPage(currentPage);
        }
    }, [currentPage, status, fetchPage]);

    const paginatedItems = useMemo(() => {
        if (status) return displayItems;
        const startIndex = (currentPage - 1) * itemsPerPage;
        return initialItems.slice(startIndex, startIndex + itemsPerPage);
    }, [status, displayItems, initialItems, currentPage, itemsPerPage]);

    const handlePrevPage = useCallback(() => {
        setCurrentPage((prev) => Math.max(1, prev - 1));
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const handleNextPage = useCallback(() => {
        if (currentPage >= totalPages) return;
        setCurrentPage((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentPage, totalPages]);

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

    const showPagination = totalPages > 1;
    const canGoNext = currentPage < totalPages;

    return (
        <div className="min-h-screen pb-8">
            <header className="sticky top-0 z-30 bg-brand-bg/95 backdrop-blur-sm border-b border-white/10 mb-6">
                <div className="flex items-center justify-between px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                            aria-label="Go back"
                        >
                            <FiArrowLeft className="h-6 w-6 text-brand-text-light" />
                        </button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-brand-text-light">
                                {title}
                            </h1>
                            <p className="text-sm text-brand-text-dim">
                                {totalItems} items
                            </p>
                        </div>
                    </div>

                    {showPagination && (
                        <div className="hidden sm:flex items-center gap-3">
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Previous page"
                            >
                                <FiChevronLeft className="h-5 w-5 text-brand-text-light" />
                            </button>
                            <span className="text-brand-text-light font-medium min-w-[80px] text-center">
                                Page {currentPage}{status ? '' : ` of ${totalPages}`}
                            </span>
                            <button
                                onClick={handleNextPage}
                                disabled={!canGoNext}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Next page"
                            >
                                <FiChevronRight className="h-5 w-5 text-brand-text-light" />
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="px-4 sm:px-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-primary border-t-transparent"></div>
                    </div>
                ) : (
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
                )}
            </main>

            {showPagination && (
                <footer className="sm:hidden fixed bottom-0 left-0 right-0 flex items-center justify-center gap-4 p-4 bg-brand-bg/95 backdrop-blur-sm border-t border-white/10"
                    style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
                >
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-surface hover:bg-brand-primary/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <FiChevronLeft className="h-5 w-5 text-brand-text-light" />
                        <span className="text-brand-text-light font-medium">Prev</span>
                    </button>
                    <span className="text-brand-text-light font-medium min-w-[80px] text-center">
                        {currentPage}{status ? '' : ` / ${totalPages}`}
                    </span>
                    <button
                        onClick={handleNextPage}
                        disabled={!canGoNext}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-surface hover:bg-brand-primary/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <span className="text-brand-text-light font-medium">Next</span>
                        <FiChevronRight className="h-5 w-5 text-brand-text-light" />
                    </button>
                </footer>
            )}
        </div>
    );
};

