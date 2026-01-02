import React, { memo, useMemo, useDeferredValue } from "react";
import { useWatchlistStore, getFilteredItems, calculateWatchStats, formatWatchTime, type WatchStatistics } from "../store/useWatchlistStore";
import { FiCheckCircle, FiStar, FiBookmark, FiActivity, FiTrendingUp } from "react-icons/fi";

const EMPTY_STATS: WatchStatistics = {
    shows: { totalWatchTimeMinutes: 0, totalEpisodes: 0, totalShows: 0 },
    movies: { totalWatchTimeMinutes: 0, totalMovies: 0 },
    summary: { currentlyWatching: 0, completionRate: 0, topGenres: [], averageRating: 0 },
};

const HeroCircle = ({ totalMinutes, showsMinutes, moviesMinutes }: { totalMinutes: number, showsMinutes: number, moviesMinutes: number }) => {
    const totalTimeStr = formatWatchTime(totalMinutes);
    const showsTimeStr = formatWatchTime(showsMinutes);
    const moviesTimeStr = formatWatchTime(moviesMinutes);

    return (
        <div className="relative flex flex-col items-center justify-center py-10 lg:py-0 lg:h-full">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
            <div className="relative w-64 h-64 lg:w-72 lg:h-72">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-white/5"
                    />
                    <defs>
                        <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#EAB308" /> 
                            <stop offset="100%" stopColor="#A855F7" /> 
                        </linearGradient>
                    </defs>
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="url(#circleGradient)"
                        strokeWidth="2" 
                        strokeLinecap="round"
                        strokeDasharray="283" 
                        strokeDashoffset="70" 
                        className="opacity-90 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]"
                    />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <h2 className="text-4xl lg:text-5xl font-bold bg-linear-to-br from-yellow-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
                        {totalTimeStr.split(' ')[0]} 
                        <span className="text-xl lg:text-2xl text-white/40 font-medium ml-1">
                            {totalTimeStr.split(' ').slice(1).join(' ')}
                        </span>
                    </h2>
                    <p className="text-brand-text-dim text-sm mt-2 font-medium tracking-wide">
                        Total time watching
                    </p>
                </div>
            </div>


            <div className="mt-6 flex items-center gap-3 text-sm text-brand-text-dim/60 font-medium tracking-wider uppercase">
                <span>Shows: <span className="text-brand-text-dim">{showsTimeStr}</span></span>
                <span className="w-1 h-1 bg-white/20 rounded-full" />
                <span>Movies: <span className="text-brand-text-dim">{moviesTimeStr}</span></span>
            </div>
        </div>
    );
};

const StatTile: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    status: string;
    accentColor?: "yellow" | "purple" | "blue" | "green";
}> = ({ icon, title, subtitle, status, accentColor = "yellow" }) => {
    const iconStyles = {
        yellow: "text-yellow-400 bg-yellow-400/10",
        purple: "text-purple-400 bg-purple-400/10",
        blue: "text-blue-400 bg-blue-400/10",
        green: "text-green-400 bg-green-400/10",
    }[accentColor];

    return (
        <div className="bg-[#121214] border border-white/6 rounded-2xl p-6 flex flex-col justify-between hover:border-white/10 transition-colors duration-300 group">
            <div className="flex items-start gap-4 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconStyles} shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
                <div>
                    <h3 className="text-base font-bold text-white mb-0.5">{title}</h3>
                    <p className="text-xs text-brand-text-dim/60 uppercase tracking-wide">{subtitle}</p>
                </div>
            </div>

            <div>
                <p className="text-brand-text-light text-sm font-medium leading-relaxed">
                    {status}
                </p>
            </div>
        </div>
    );
};

const CompletionCard: React.FC<{ rate: number, completedCount: number }> = ({ rate, completedCount }) => (
    <div className="bg-[#121214] border border-white/6 rounded-2xl p-6 flex items-center gap-6 mt-6 hover:border-white/10 transition-colors duration-300">
        <div className="relative w-16 h-16 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                    className="text-white/5"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="text-brand-primary drop-shadow-[0_0_8px_rgba(234,179,8,0.2)]"
                    strokeDasharray={`${rate}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                {rate}%
            </div>
        </div>
        <div>
            <h3 className="text-lg font-bold text-white mb-1">Completion Progress</h3>
            <p className="text-brand-text-dim text-sm mb-1">{completedCount} Titles Completed</p>
            <p className="text-xs text-white/30 italic">Stats get better when you actually watch something.</p>
        </div>
    </div>
);


export const StatisticsPage: React.FC = memo(() => {
    const watchlist = useWatchlistStore(state => state.watchlist);

    const deferredWatchlist = useDeferredValue(watchlist);
    const isStale = deferredWatchlist !== watchlist;

    const { currentlyWatchingItems, watchedItems, watchlistItems } = useMemo(() =>
        getFilteredItems(deferredWatchlist, null),
        [deferredWatchlist]);

    const stats = useMemo<WatchStatistics>(() => {
        if (deferredWatchlist.length === 0) return EMPTY_STATS;
        return calculateWatchStats(deferredWatchlist, currentlyWatchingItems.length, watchedItems);
    }, [deferredWatchlist, currentlyWatchingItems.length, watchedItems]);

    const totalWatchTime = stats.shows.totalWatchTimeMinutes + stats.movies.totalWatchTimeMinutes;

    let bingeLevel = "Beginner";
    if (stats.summary.currentlyWatching >= 3) bingeLevel = "Regular";
    if (stats.summary.currentlyWatching >= 6) bingeLevel = "Pro";
    if (stats.summary.currentlyWatching >= 10) bingeLevel = "Binge Master";

    const tasteLevel = stats.summary.averageRating > 0
        ? `${stats.summary.averageRating}/10 Avg`
        : "Unrated";
    const tasteStatus = stats.summary.averageRating > 0
        ? `Based on ${watchedItems.length} rated titles`
        : "Your opinions are loading...";

    const commitmentMsg = watchlistItems.length === 0
        ? "No pressure."
        : watchlistItems.length < 5
            ? "Low risk. No pressure."
            : "A growing backlog.";

    return (
        <div className={`container mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-opacity duration-300 ${isStale ? "opacity-70" : "opacity-100"}`}>

            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Your Watching Stats</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div className="lg:col-span-1 bg-brand-bg border border-white/6 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl shadow-black/50">
                    <HeroCircle
                        totalMinutes={totalWatchTime}
                        showsMinutes={stats.shows.totalWatchTimeMinutes}
                        moviesMinutes={stats.movies.totalWatchTimeMinutes}
                    />
                </div>

                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <StatTile
                            icon={<FiActivity className="w-5 h-5" />}
                            title="Watching Style"
                            subtitle={`Binge Level: ${bingeLevel}`}
                            status={`${stats.summary.currentlyWatching} titles in progress`}
                            accentColor="yellow"
                        />
                        <StatTile
                            icon={<FiCheckCircle className="w-5 h-5" />}
                            title="Follow-through"
                            subtitle={watchedItems.length > 0 ? "You finish what you start." : "No completed titles yet."}
                            status={watchedItems.length > 0 ? "Keep it up!" : "Let's change that."}
                            accentColor="purple"
                        />
                        <StatTile
                            icon={<FiStar className="w-5 h-5" />}
                            title="Taste Level"
                            subtitle={tasteLevel}
                            status={tasteStatus}
                            accentColor="yellow"
                        />
                        <StatTile
                            icon={<FiBookmark className="w-5 h-5" />}
                            title="Watchlist Commitment"
                            subtitle={`${watchlistItems.length} title${watchlistItems.length !== 1 ? 's' : ''} saved`}
                            status={commitmentMsg}
                            accentColor="purple"
                        />
                    </div>

                    <CompletionCard
                        rate={stats.summary.completionRate}
                        completedCount={watchedItems.length}
                    />
                </div>
            </div>

            {stats.summary.topGenres.length > 0 && (
                <div className="mt-8 bg-brand-bg border border-white/6 rounded-2xl p-6">
                    <h2 className="text-sm uppercase tracking-wider text-brand-text-dim font-medium mb-4 flex items-center gap-2">
                        <FiTrendingUp className="w-4 h-4" /> Top Genres
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {stats.summary.topGenres.map(genre => (
                            <div key={genre.name} className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/10 hover:bg-white/10 transition-colors">
                                <span className="text-sm text-white font-medium">{genre.name}</span>
                                <span className="text-xs text-brand-text-dim bg-black/40 rounded-full px-2 py-0.5 min-w-[20px] text-center">{genre.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
});

StatisticsPage.displayName = "StatisticsPage";
