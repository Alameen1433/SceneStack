import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/useUIStore';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import { useUIContext } from '../../contexts/UIContext';
import { FiEye, FiCheck, FiPlus, FiTrash2, FiInfo } from 'react-icons/fi';

const DesktopMenu = ({ position, onClose, item, isWatched, isInWatchlist }: any) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const { deleteItem, syncItem } = useWatchlistStore();
    const { handleSelectMedia } = useUIContext();

    const adjustPosition = () => {
        const { innerWidth, innerHeight } = window;
        const x = position.x;
        const y = position.y;
        if (!menuRef.current) return { top: y, left: x };
        const correctedX = x + 200 > innerWidth ? x - 210 : x;
        const correctedY = y + 250 > innerHeight ? y - 250 : y;
        return { top: correctedY, left: correctedX };
    };

    const handleViewDetails = () => {
        const rect = new DOMRect(position.x, position.y, 100, 150);
        handleSelectMedia({
            id: item.id,
            media_type: item.media_type,
            poster_path: item.poster_path,
            title: item.media_type === 'movie' ? item.title : undefined,
            name: item.media_type === 'tv' ? item.title : undefined,
        } as any, rect);
        onClose();
    };

    const isMovie = item.media_type === 'movie';

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
                <p className="text-xs text-brand-text-dim capitalize">{item.media_type === 'movie' ? 'Movie' : 'TV Series'}</p>
            </div>

            <div className="flex flex-col gap-0.5">
                <button
                    onClick={handleViewDetails}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-brand-text-light hover:bg-brand-primary/10 rounded-xl transition-colors text-left"
                >
                    <FiInfo className="text-brand-primary" /> View Details
                </button>

                {!isInWatchlist && (
                    <button
                        onClick={() => {
                            syncItem({ ...item, watched: false, watchlist: true });
                            onClose();
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-brand-text-light hover:bg-brand-primary/10 rounded-xl transition-colors text-left"
                    >
                        <FiPlus className="text-brand-primary" /> Add to List
                    </button>
                )}

                {isMovie && isInWatchlist && (
                    <button
                        onClick={() => {
                            syncItem({ ...item, watched: !isWatched, watchlist: true });
                            onClose();
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-brand-text-light hover:bg-brand-primary/10 rounded-xl transition-colors text-left"
                    >
                        {isWatched ? <><FiEye className="text-brand-secondary" /> Mark Unwatched</> : <><FiCheck className="text-brand-primary" /> Mark Watched</>}
                    </button>
                )}

                {isMovie && isInWatchlist && (
                    <button
                        onClick={() => { deleteItem(item.id); onClose(); }}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left"
                    >
                        <FiTrash2 /> Remove from List
                    </button>
                )}
            </div>
        </motion.div>
    );
};

const MobileBottomSheet = ({ onClose, item, isWatched, isInWatchlist }: any) => {
    const { deleteItem, syncItem } = useWatchlistStore();
    const { handleSelectMedia } = useUIContext();

    const handleViewDetails = () => {
        const rect = new DOMRect(window.innerWidth / 2 - 50, window.innerHeight / 2 - 75, 100, 150);
        handleSelectMedia({
            id: item.id,
            media_type: item.media_type,
            poster_path: item.poster_path,
            title: item.media_type === 'movie' ? item.title : undefined,
            name: item.media_type === 'tv' ? item.title : undefined,
        } as any, rect);
        onClose();
    };

    const isMovie = item.media_type === 'movie';

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
                        <div>
                            <h3 className="text-lg font-semibold text-brand-text-light">{item.title}</h3>
                            <p className="text-sm text-brand-text-dim capitalize">{item.media_type === 'movie' ? 'Movie' : 'TV Series'}</p>
                        </div>
                    </div>

                    <div className="p-2 flex flex-col gap-2">
                        <div className="bg-brand-bg/50 rounded-2xl overflow-hidden">
                            <button
                                onClick={handleViewDetails}
                                className="w-full flex items-center px-4 py-3.5 text-[17px] text-brand-text-light active:bg-brand-primary/10 border-b border-brand-primary/5"
                            >
                                <span className="flex items-center gap-3"><FiInfo className="text-xl text-brand-primary" /> View Details</span>
                            </button>

                            {!isInWatchlist && (
                                <button
                                    onClick={() => { syncItem({ ...item, watched: false, watchlist: true }); onClose(); }}
                                    className="w-full flex items-center px-4 py-3.5 text-[17px] text-brand-text-light active:bg-brand-primary/10"
                                >
                                    <span className="flex items-center gap-3"><FiPlus className="text-xl text-brand-primary" /> Add to List</span>
                                </button>
                            )}

                            {isMovie && isInWatchlist && (
                                <button
                                    onClick={() => {
                                        syncItem({ ...item, watched: !isWatched, watchlist: true });
                                        onClose();
                                    }}
                                    className="w-full flex items-center px-4 py-3.5 text-[17px] text-brand-text-light active:bg-brand-primary/10"
                                >
                                    <span className="flex items-center gap-3">
                                        {isWatched ? <FiEye className="text-xl text-brand-secondary" /> : <FiCheck className="text-xl text-brand-primary" />}
                                        {isWatched ? "Mark as Unwatched" : "Mark as Watched"}
                                    </span>
                                </button>
                            )}
                        </div>

                        {isMovie && isInWatchlist && (
                            <div className="bg-brand-bg/50 rounded-2xl overflow-hidden">
                                <button
                                    onClick={() => { deleteItem(item.id); onClose(); }}
                                    className="w-full flex items-center px-4 py-3.5 text-[17px] text-red-400 active:bg-red-500/10"
                                >
                                    <span className="flex items-center gap-3"><FiTrash2 className="text-xl" /> Remove from List</span>
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

    if (!mediaItem) return null;

    const isInWatchlist = watchlist.some(i => i.id === mediaItem.id);
    const isWatched = watchlist.find(i => i.id === mediaItem.id) ? (watchlist.find(i => i.id === mediaItem.id) as any).watched : false;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {type === 'desktop' && (
                        <div className="fixed inset-0 z-40" onClick={closeMenu} onContextMenu={(e) => { e.preventDefault(); closeMenu(); }} />
                    )}

                    {type === 'desktop' ? (
                        <DesktopMenu
                            position={position}
                            onClose={closeMenu}
                            item={mediaItem}
                            isWatched={isWatched}
                            isInWatchlist={isInWatchlist}
                        />
                    ) : (
                        <MobileBottomSheet
                            onClose={closeMenu}
                            item={mediaItem}
                            isWatched={isWatched}
                            isInWatchlist={isInWatchlist}
                        />
                    )}
                </>
            )}
        </AnimatePresence>
    );
};
