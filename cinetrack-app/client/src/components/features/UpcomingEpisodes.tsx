import React, { useMemo, memo, useRef } from "react";
import { FiCalendar, FiChevronRight } from "react-icons/fi";
import { useWatchlistStore } from "../../store/useWatchlistStore";
import { useUIContext } from "../../contexts/UIContext";
import type { TVDetail, WatchlistItem } from "../../types/types";

interface UpcomingShow {
    item: WatchlistItem;
    name: string;
    poster_path: string | null;
    nextEpisode: string;
    airDate: string;
    daysUntil: number;
}

export const UpcomingEpisodes: React.FC = memo(() => {
    const watchlist = useWatchlistStore((state) => state.watchlist);
    const { handleSelectMedia } = useUIContext();
    const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    const upcomingShows = useMemo(() => {
        const now = new Date();
        const shows: UpcomingShow[] = [];

        for (const item of watchlist) {
            if (item.media_type !== "tv") continue;
            const tvItem = item as TVDetail;

            if (!tvItem.next_episode_to_air?.air_date) continue;

            const airDate = new Date(tvItem.next_episode_to_air.air_date);
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const airDay = new Date(airDate.getFullYear(), airDate.getMonth(), airDate.getDate());

            if (airDay < today) continue;

            const daysUntil = Math.round(
                (airDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            shows.push({
                item,
                name: tvItem.name,
                poster_path: tvItem.poster_path,
                nextEpisode: `S${tvItem.next_episode_to_air.season_number}E${tvItem.next_episode_to_air.episode_number}`,
                airDate: tvItem.next_episode_to_air.air_date,
                daysUntil,
            });
        }

        return shows.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 10);
    }, [watchlist]);

    if (upcomingShows.length === 0) return null;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    const getDaysLabel = (days: number) => {
        if (days === 0) return "Today";
        if (days === 1) return "Tomorrow";
        return `${days}d`;
    };

    const handleClick = (show: UpcomingShow) => {
        const element = cardRefs.current.get(show.item.id);
        if (element) {
            handleSelectMedia(show.item, element.getBoundingClientRect());
        }
    };

    return (
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                <FiCalendar className="h-5 w-5 text-brand-primary" />
                <h3 className="text-lg font-semibold text-white">Upcoming Episodes</h3>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {upcomingShows.map((show) => (
                    <div
                        key={show.item.id}
                        ref={(el) => {
                            if (el) cardRefs.current.set(show.item.id, el);
                        }}
                        onClick={() => handleClick(show)}
                        className="flex-shrink-0 w-28 cursor-pointer group"
                    >
                        <div className="relative rounded-xl overflow-hidden mb-2">
                            {show.poster_path ? (
                                <img
                                    src={`https://image.tmdb.org/t/p/w185${show.poster_path}`}
                                    alt={show.name}
                                    className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full aspect-[2/3] bg-brand-surface flex items-center justify-center">
                                    <FiCalendar className="h-8 w-8 text-brand-text-dim" />
                                </div>
                            )}

                            {/* Days until badge */}
                            <div className="absolute top-2 right-2 bg-brand-primary px-2 py-0.5 rounded-full text-xs font-medium text-white">
                                {getDaysLabel(show.daysUntil)}
                            </div>

                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <FiChevronRight className="h-8 w-8 text-white" />
                            </div>
                        </div>

                        <p className="text-sm font-medium text-white truncate">
                            {show.name}
                        </p>
                        <p className="text-xs text-brand-text-dim">
                            {show.nextEpisode} • {formatDate(show.airDate)}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
});

UpcomingEpisodes.displayName = "UpcomingEpisodes";
