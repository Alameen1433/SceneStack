import React, { memo, useMemo } from "react";
import { useWatchlistStore, getFilteredItems, calculateWatchStats, formatWatchTime, type WatchStatistics } from "../store/useWatchlistStore";

import { FiPlayCircle, FiCheckCircle, FiStar, FiBookmark, FiBarChart2 } from "react-icons/fi";

// Stat Card Component
const StatCard: React.FC<{
    title: string;
    mainValue: string;
    subtitle: string;
    details?: string;
    gradientFrom?: string;
    gradientTo?: string;
}> = ({ title, mainValue, subtitle, details, gradientFrom = "from-brand-primary", gradientTo = "to-brand-secondary" }) => (
    <div className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 transition-all duration-300 hover:bg-white/[0.07] hover:border-white/20 group">
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientFrom} ${gradientTo} opacity-60 group-hover:opacity-100 transition-opacity`} />

        <p className="text-xs uppercase tracking-wider text-brand-text-dim font-medium mb-3">
            {title}
        </p>
        <p className={`text-3xl font-bold bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent mb-1`}>
            {mainValue}
        </p>
        <p className="text-sm text-brand-text-dim mb-1">{subtitle}</p>
        {details && (
            <p className="text-xs text-brand-text-dim/70">{details}</p>
        )}
    </div>
);


const MiniStatCard: React.FC<{
    label: string;
    value: string | number;
    icon: React.ReactNode;
}> = ({ label, value, icon }) => (
    <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center text-brand-primary">
            {icon}
        </div>
        <div>
            <p className="text-lg font-semibold text-white">{value}</p>
            <p className="text-xs text-brand-text-dim">{label}</p>
        </div>
    </div>
);

const GenreBadge: React.FC<{ name: string; count: number }> = ({ name, count }) => (
    <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5 border border-white/10">
        <span className="text-sm text-white">{name}</span>
        <span className="text-xs text-brand-text-dim bg-white/10 rounded-full px-2 py-0.5">{count}</span>
    </div>
);

export const StatisticsPage: React.FC = memo(() => {
    const watchlist = useWatchlistStore(state => state.watchlist);
    const { currentlyWatchingItems, watchedItems } = useMemo(() =>
        getFilteredItems(watchlist, null),
        [watchlist]);

    const stats = useMemo<WatchStatistics>(() => {
        return calculateWatchStats(watchlist, currentlyWatchingItems.length, watchedItems);
    }, [watchlist, currentlyWatchingItems.length, watchedItems]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6">
            <h1 className="text-2xl font-bold text-white mb-6">Your Stats</h1>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <StatCard
                    title="Shows"
                    mainValue={formatWatchTime(stats.shows.totalWatchTimeMinutes)}
                    subtitle="All Time"
                    details={`${stats.shows.totalEpisodes.toLocaleString()} episodes, ${stats.shows.totalShows} shows`}
                    gradientFrom="from-purple-500"
                    gradientTo="to-pink-500"
                />
                <StatCard
                    title="Movies"
                    mainValue={formatWatchTime(stats.movies.totalWatchTimeMinutes)}
                    subtitle="All Time"
                    details={`${stats.movies.totalMovies} movies`}
                    gradientFrom="from-cyan-500"
                    gradientTo="to-blue-500"
                />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <MiniStatCard
                    label="Currently Watching"
                    value={stats.summary.currentlyWatching}
                    icon={<FiPlayCircle className="w-5 h-5" />}
                />
                <MiniStatCard
                    label="Completion Rate"
                    value={`${stats.summary.completionRate}%`}
                    icon={<FiCheckCircle className="w-5 h-5" />}
                />
                <MiniStatCard
                    label="Avg. Rating"
                    value={stats.summary.averageRating > 0 ? `${stats.summary.averageRating}/10` : "—"}
                    icon={<FiStar className="w-5 h-5" />}
                />
                <MiniStatCard
                    label="Total in List"
                    value={watchlist.length}
                    icon={<FiBookmark className="w-5 h-5" />}
                />
            </div>

            {/* Top Genres */}
            {stats.summary.topGenres.length > 0 && (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                    <h2 className="text-sm uppercase tracking-wider text-brand-text-dim font-medium mb-4">
                        Top Genres
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {stats.summary.topGenres.map(genre => (
                            <GenreBadge key={genre.name} name={genre.name} count={genre.count} />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {watchlist.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <FiBarChart2 className="w-8 h-8 text-brand-text-dim" />
                    </div>
                    <p className="text-brand-text-dim text-lg mb-2">No stats yet</p>
                    <p className="text-brand-text-dim/70 text-sm">Add items to your watchlist and mark them as watched to see your stats!</p>
                </div>
            )}
        </div>
    );
});

StatisticsPage.displayName = "StatisticsPage";
