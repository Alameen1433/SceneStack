import { useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/useUIStore';
import type { ContextMenuItem } from '../../store/useUIStore';
import { useWatchlistStore, useIsItemPending } from '../../store/useWatchlistStore';
import { useUIContext } from '../../contexts/UIContext';
import { FiEye, FiCheck, FiPlus, FiTrash2, FiInfo, FiLoader } from 'react-icons/fi';
import type { SearchResult } from '../../types/types';

interface MenuProps {
    position?: { x: number; y: number };
    onClose: () => void;
    item: ContextMenuItem;
    isWatched: boolean;
    isInWatchlist: boolean;
    isPending: boolean;
}

const toSearchResult = (item: ContextMenuItem): SearchResult => ({
    id: item.id,
    media_type: item.media_type,
    poster_path: item.poster_path,
    title: item.media_type === 'movie' ? item.title : undefined,
    name: item.media_type === 'tv' ? item.title : undefined,
    overview: '',
    backdrop_path: null,
});

const useContextMenuActions = (item: ContextMenuItem, onClose: () => void, rect: DOMRect) => {
    const { removeFromWatchlist, toggleMovieWatched, toggleWatchlistFromSearchResult } = useWatchlistStore();
    const { handleSelectMedia } = useUIContext();

    const viewDetails = useCallback(() => {
        handleSelectMedia(toSearchResult(item), rect);
        onClose();
    }, [item, rect, handleSelectMedia, onClose]);

    const addToList = useCallback(() => {
        toggleWatchlistFromSearchResult(toSearchResult(item));
        onClose();
    }, [item, toggleWatchlistFromSearchResult, onClose]);

    const toggleWatched = useCallback(() => {
        toggleMovieWatched(item.id);
        onClose();
    }, [item.id, toggleMovieWatched, onClose]);

    const remove = useCallback(() => {
        removeFromWatchlist(item.id);
        onClose();
    }, [item.id, removeFromWatchlist, onClose]);

    return { viewDetails, addToList, toggleWatched, remove };
};

const Spinner = () => <FiLoader className="animate-spin" />;

const DesktopMenu = ({ position, onClose, item, isWatched, isInWatchlist, isPending }: MenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const rect = new DOMRect(position?.x ?? 0, position?.y ?? 0, 100, 150);
    const { viewDetails, addToList, toggleWatched, remove } = useContextMenuActions(item, onClose, rect);

    const adjustPosition = () => {
        if (!position) return { top: 0, left: 0 };
        const { innerWidth, innerHeight } = window;
        const x = position.x;
        const y = position.y;
        if (!menuRef.current) return { top: y, left: x };
        const correctedX = x + 200 > innerWidth ? x - 210 : x;
        const correctedY = y + 250 > innerHeight ? y - 250 : y;
        return { top: correctedY, left: correctedX };
    };

    const isMovie = item.media_type === 'movie';
    const btnBase = "flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-colors text-left";
    const btnDisabled = "opacity-50 cursor-not-allowed";

    return (
        <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="fixed w-52 z-50 bg-brand-surface/95 backdrop-blur-2xl border border-brand-primary/20 rounded-2xl shadow-2xl p-2 overflow-hidden flex flex-col gap-1"
            style={adjustPosition()}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div className="px-3 py-2 border-b border-brand-primary/10 mb-1">
                <h3 className="text-sm font-semibold text-brand-text-light truncate">{item.title}</h3>
                <p className="text-xs text-brand-text-dim capitalize">{isMovie ? 'Movie' : 'TV Series'}</p>
            </div>

            <div className="flex flex-col gap-0.5">
                <button onClick={viewDetails} className={`${btnBase} text-brand-text-light hover:bg-brand-primary/10`}>
                    <FiInfo className="text-brand-primary" /> View Details
                </button>

                {!isInWatchlist && (
                    <button
                        onClick={addToList}
                        disabled={isPending}
                        className={`${btnBase} text-brand-text-light hover:bg-brand-primary/10 ${isPending ? btnDisabled : ''}`}
                    >
                        {isPending ? <Spinner /> : <FiPlus className="text-brand-primary" />} Add to List
                    </button>
                )}

                {isMovie && isInWatchlist && (
                    <button
                        onClick={toggleWatched}
                        disabled={isPending}
                        className={`${btnBase} text-brand-text-light hover:bg-brand-primary/10 ${isPending ? btnDisabled : ''}`}
                    >
                        {isPending ? <Spinner /> : isWatched ? <FiEye className="text-brand-secondary" /> : <FiCheck className="text-brand-primary" />}
                        {isWatched ? ' Mark Unwatched' : ' Mark Watched'}
                    </button>
                )}

                {isInWatchlist && (
                    <button
                        onClick={remove}
                        disabled={isPending}
                        className={`${btnBase} text-red-400 hover:bg-red-500/10 ${isPending ? btnDisabled : ''}`}
                    >
                        {isPending ? <Spinner /> : <FiTrash2 />} Remove from List
                    </button>
                )}
            </div>
        </motion.div>
    );
};

const MobileBottomSheet = ({ onClose, item, isWatched, isInWatchlist, isPending }: MenuProps) => {
    const rect = new DOMRect(window.innerWidth / 2 - 50, window.innerHeight / 2 - 75, 100, 150);
    const { viewDetails, addToList, toggleWatched, remove } = useContextMenuActions(item, onClose, rect);

    const isMovie = item.media_type === 'movie';
    const btnBase = "w-full flex items-center px-4 py-3.5 text-[17px]";
    const btnDisabled = "opacity-50";

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-8"
            >
                <div className="bg-brand-surface/95 backdrop-blur-3xl rounded-3xl overflow-hidden border border-brand-primary/20 shadow-2xl">
                    <div className="p-4 flex gap-4 items-center border-b border-brand-primary/10">
                        {item.poster_path && (
                            <img
                                src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                                alt=""
                                className="w-12 h-18 object-cover rounded-lg shadow-md ring-1 ring-brand-primary/20"
                            />
                        )}
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-brand-text-light">{item.title}</h3>
                            <p className="text-sm text-brand-text-dim capitalize">{isMovie ? 'Movie' : 'TV Series'}</p>
                        </div>
                        {isPending && <FiLoader className="animate-spin text-brand-primary text-xl" />}
                    </div>

                    <div className="p-2 flex flex-col gap-2">
                        <div className="bg-brand-bg/50 rounded-2xl overflow-hidden">
                            <button onClick={viewDetails} className={`${btnBase} text-brand-text-light active:bg-brand-primary/10 border-b border-brand-primary/5`}>
                                <span className="flex items-center gap-3"><FiInfo className="text-xl text-brand-primary" /> View Details</span>
                            </button>

                            {!isInWatchlist && (
                                <button
                                    onClick={addToList}
                                    disabled={isPending}
                                    className={`${btnBase} text-brand-text-light active:bg-brand-primary/10 ${isPending ? btnDisabled : ''}`}
                                >
                                    <span className="flex items-center gap-3">
                                        {isPending ? <Spinner /> : <FiPlus className="text-xl text-brand-primary" />} Add to List
                                    </span>
                                </button>
                            )}

                            {isMovie && isInWatchlist && (
                                <button
                                    onClick={toggleWatched}
                                    disabled={isPending}
                                    className={`${btnBase} text-brand-text-light active:bg-brand-primary/10 ${isPending ? btnDisabled : ''}`}
                                >
                                    <span className="flex items-center gap-3">
                                        {isPending ? <Spinner /> : isWatched ? <FiEye className="text-xl text-brand-secondary" /> : <FiCheck className="text-xl text-brand-primary" />}
                                        {isWatched ? "Mark as Unwatched" : "Mark as Watched"}
                                    </span>
                                </button>
                            )}
                        </div>

                        {isInWatchlist && (
                            <div className="bg-brand-bg/50 rounded-2xl overflow-hidden">
                                <button
                                    onClick={remove}
                                    disabled={isPending}
                                    className={`${btnBase} text-red-400 active:bg-red-500/10 ${isPending ? btnDisabled : ''}`}
                                >
                                    <span className="flex items-center gap-3">
                                        {isPending ? <Spinner /> : <FiTrash2 className="text-xl" />} Remove from List
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-3 bg-brand-surface backdrop-blur-xl rounded-2xl py-3.5 text-[17px] font-semibold text-brand-text-light shadow-lg active:scale-[0.98] transition-transform border border-brand-primary/10"
                >
                    Cancel
                </button>
            </motion.div>
        </>
    );
};

export const ContextMenu = () => {
    const { isOpen, position, mediaItem, type, closeMenu } = useUIStore();
    const { watchlist } = useWatchlistStore();
    const isPending = useIsItemPending(mediaItem?.id ?? 0);

    if (!mediaItem) return null;

    const isInWatchlist = watchlist.some(i => i.id === mediaItem.id);
    const watchlistItem = watchlist.find(i => i.id === mediaItem.id);
    const isWatched = watchlistItem && 'watched' in watchlistItem ? watchlistItem.watched : false;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {type === 'desktop' && (
                        <div className="fixed inset-0 z-40" onClick={closeMenu} onContextMenu={(e) => { e.preventDefault(); closeMenu(); }} />
                    )}

                    {type === 'desktop' ? (
                        <DesktopMenu position={position} onClose={closeMenu} item={mediaItem} isWatched={isWatched} isInWatchlist={isInWatchlist} isPending={isPending} />
                    ) : (
                        <MobileBottomSheet onClose={closeMenu} item={mediaItem} isWatched={isWatched} isInWatchlist={isInWatchlist} isPending={isPending} />
                    )}
                </>
            )}
        </AnimatePresence>
    );
};
