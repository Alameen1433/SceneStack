import React, { memo, useMemo } from "react";
import { useWatchlistContext } from "../contexts/WatchlistContext";
import type { MovieWatchlistItem, TVWatchlistItem } from "../types/types";

const formatWatchTime = (minutes: number): string => {
    if (minutes === 0) return "0m";

    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const mins = Math.floor(minutes % 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);

    return parts.join(" ") || "0m";
};

const AVG_EPISODE_RUNTIME = 45; //fallback

interface WatchStatistics {
    shows: {
        totalWatchTimeMinutes: number;
        totalEpisodes: number;
        totalShows: number;
    };
    movies: {
        totalWatchTimeMinutes: number;
        totalMovies: number;
    };
    summary: {
        currentlyWatching: number;
        completionRate: number;
        topGenres: { name: string; count: number }[];
        averageRating: number;
    };
}

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
        {/* Gradient accent */}
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
    const { watchlist, currentlyWatchingItems, watchedItems } = useWatchlistContext();

    // Calculate statistics
    const stats = useMemo<WatchStatistics>(() => {
        const movies = watchlist.filter((item): item is MovieWatchlistItem => item.media_type === "movie");
        const tvShows = watchlist.filter((item): item is TVWatchlistItem => item.media_type === "tv");

        // Watched movies
        const watchedMovies = movies.filter(m => m.watched);
        const movieWatchTime = watchedMovies.reduce((acc, m) => acc + (m.runtime || 0), 0);

        // Watched TV episodes - use per-show runtime when available
        let totalWatchedEpisodes = 0;
        let totalWatchedShows = 0;
        let tvWatchTime = 0;

        tvShows.forEach(show => {
            const episodeCount = Object.values(show.watchedEpisodes || {}).reduce(
                (acc, eps) => acc + (Array.isArray(eps) ? eps.length : 0),
                0
            );
            if (episodeCount > 0) {
                totalWatchedEpisodes += episodeCount;
                // Use show's episode_run_time if available, otherwise fallback to average
                const episodeRuntime = show.episode_run_time?.[0] || AVG_EPISODE_RUNTIME;
                tvWatchTime += episodeCount * episodeRuntime;
                if (episodeCount >= show.number_of_episodes) {
                    totalWatchedShows++;
                }
            }
        });
        const totalItems = watchlist.length;
        const completedItems = watchedItems.length;
        const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        // Genre breakdown
        const genreCounts: Record<string, number> = {};
        watchedItems.forEach(item => {
            item.genres?.forEach(genre => {
                genreCounts[genre.name] = (genreCounts[genre.name] || 0) + 1;
            });
        });
        const topGenres = Object.entries(genreCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const ratings = watchedItems.map(item => item.vote_average).filter(r => r > 0);
        const averageRating = ratings.length > 0
            ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
            : 0;

        return {
            shows: {
                totalWatchTimeMinutes: tvWatchTime,
                totalEpisodes: totalWatchedEpisodes,
                totalShows: totalWatchedShows,
            },
            movies: {
                totalWatchTimeMinutes: movieWatchTime,
                totalMovies: watchedMovies.length,
            },
            summary: {
                currentlyWatching: currentlyWatchingItems.length,
                completionRate,
                topGenres,
                averageRating,
            },
        };
    }, [watchlist, currentlyWatchingItems, watchedItems]);

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
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
                <MiniStatCard
                    label="Completion Rate"
                    value={`${stats.summary.completionRate}%`}
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
                <MiniStatCard
                    label="Avg. Rating"
                    value={stats.summary.averageRating > 0 ? `${stats.summary.averageRating}/10` : "—"}
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    }
                />
                <MiniStatCard
                    label="Total in List"
                    value={watchlist.length}
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    }
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-brand-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <p className="text-brand-text-dim text-lg mb-2">No stats yet</p>
                    <p className="text-brand-text-dim/70 text-sm">Add items to your watchlist and mark them as watched to see your stats!</p>
                </div>
            )}
        </div>
    );
});

StatisticsPage.displayName = "StatisticsPage";
