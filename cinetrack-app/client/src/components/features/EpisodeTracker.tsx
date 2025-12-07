import React, { useState, useEffect, useCallback, useRef } from "react";
import type { TVDetail, SeasonDetail } from "../../types/types";
import { TMDB_IMAGE_BASE_URL } from "../../constants/constants";
import { Confetti } from "../common/Confetti";

export const EpisodeTracker: React.FC<{
  tvShow: TVDetail;
  getSeasonDetails: (
    tvId: number,
    seasonNumber: number
  ) => Promise<SeasonDetail>;
  watchedEpisodes: Record<number, number[]>;
  onToggleEpisode: (
    tvId: number,
    seasonNumber: number,
    episodeNumber: number
  ) => void;
  onToggleSeasonWatched: (
    tvId: number,
    seasonNumber: number,
    allEpisodeNumbers: number[]
  ) => void;
}> = ({
  tvShow,
  getSeasonDetails,
  watchedEpisodes,
  onToggleEpisode,
  onToggleSeasonWatched,
}) => {
    const [selectedSeason, setSelectedSeason] = useState<number>(
      tvShow.seasons[0]?.season_number ?? 1
    );
    const [seasonData, setSeasonData] = useState<SeasonDetail | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const prevWatchedRef = useRef(watchedEpisodes);
    const [expandedOverviews, setExpandedOverviews] = useState(new Set<number>());

    const fetchSeasonData = useCallback(
      async (seasonNum: number) => {
        setIsLoading(true);
        try {
          const data = await getSeasonDetails(tvShow.id, seasonNum);
          setSeasonData(data);
        } catch (error) {
          console.error("Failed to fetch season details", error);
        } finally {
          setIsLoading(false);
        }
      },
      [getSeasonDetails, tvShow.id]
    );

    useEffect(() => {
      const initialSeason =
        tvShow.seasons.find((s) => s.season_number > 0)?.season_number ??
        tvShow.seasons[0]?.season_number ??
        1;
      setSelectedSeason(initialSeason);
      fetchSeasonData(initialSeason);
      prevWatchedRef.current = watchedEpisodes; // Initialize ref
    }, [tvShow.id, tvShow.seasons]); // Removed dependencies that would cause re-fetch on every watch action

    useEffect(() => {
      if (!seasonData || !seasonData.episodes.length) {
        prevWatchedRef.current = watchedEpisodes;
        return;
      }

      const prevWatchedInSeason = prevWatchedRef.current[selectedSeason] || [];
      const currentWatchedInSeason = watchedEpisodes[selectedSeason] || [];
      const totalEpisodes = seasonData.episodes.length;

      const wasSeasonCompleted = prevWatchedInSeason.length < totalEpisodes;
      const isSeasonCompleted = currentWatchedInSeason.length === totalEpisodes;

      if (wasSeasonCompleted && isSeasonCompleted) {
        setShowConfetti(true);
      }

      prevWatchedRef.current = watchedEpisodes;
    }, [watchedEpisodes, seasonData, selectedSeason]);

    const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newSeason = Number(e.target.value);
      setSelectedSeason(newSeason);
      setSeasonData(null); // Clear old data immediately
      setExpandedOverviews(new Set()); // Reset expanded views
      fetchSeasonData(newSeason);
    };

    const toggleOverview = (episodeId: number) => {
      setExpandedOverviews((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(episodeId)) {
          newSet.delete(episodeId);
        } else {
          newSet.add(episodeId);
        }
        return newSet;
      });
    };

    const allEpisodesInSeason =
      seasonData?.episodes.map((e) => e.episode_number) ?? [];
    const watchedInSeason = watchedEpisodes[selectedSeason] ?? [];
    const isSeasonWatched =
      allEpisodesInSeason.length > 0 &&
      watchedInSeason.length === allEpisodesInSeason.length;

    return (
      <div className="relative flex flex-col h-full">
        {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-grow">
            <select
              value={selectedSeason}
              onChange={handleSeasonChange}
              className="w-full appearance-none bg-white/10 border border-white/20 text-white rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              aria-label="Select season"
            >
              {tvShow.seasons
                .filter((s) => s.episode_count > 0 && s.name)
                .map((season) => (
                  <option key={season.id} value={season.season_number}>
                    {season.name}
                  </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg
                className="fill-current h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
          {seasonData && (
            <button
              onClick={() =>
                onToggleSeasonWatched(
                  tvShow.id,
                  selectedSeason,
                  allEpisodesInSeason
                )
              }
              className="flex-shrink-0 py-2 px-3 text-xs font-semibold rounded-md transition-colors bg-white/10 hover:bg-white/20 text-white"
              aria-label={
                isSeasonWatched
                  ? "Mark all episodes in this season as unwatched"
                  : "Mark all episodes in this season as watched"
              }
            >
              {isSeasonWatched ? "Unmark All" : "Mark All"}
            </button>
          )}
        </div>

        {isLoading && (
          <div className="flex-grow flex items-center justify-center">
            <svg
              className="animate-spin h-8 w-8 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        )}

        {!isLoading && seasonData && (
          <ul className="space-y-3 overflow-y-auto flex-grow pr-2">
            {seasonData.episodes.map((episode) => {
              const airDate = episode.air_date
                ? new Date(episode.air_date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
                : "N/A";
              const isExpanded = expandedOverviews.has(episode.id);
              const needsTruncation =
                episode.overview && episode.overview.length > 150;

              return (
                <li
                  key={episode.id}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer"
                  onClick={() =>
                    onToggleEpisode(
                      tvShow.id,
                      selectedSeason,
                      episode.episode_number
                    )
                  }
                >
                  {/* Episode image - hidden on mobile for cleaner look */}
                  <div className="hidden md:block flex-shrink-0">
                    {episode.still_path ? (
                      <img
                        src={`${TMDB_IMAGE_BASE_URL.replace("w500", "w300")}${episode.still_path
                          }`}
                        alt={`Still from ${episode.name}`}
                        className="w-28 h-16 object-cover rounded-lg bg-brand-surface"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-28 h-16 bg-brand-surface rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-brand-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.55a2.5 2.5 0 010 4.09L15 18M3 8a2 2 0 012-2h5.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V18a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Watched indicator on mobile - shows at left */}
                  <div className="md:hidden flex-shrink-0 w-6 h-6 flex items-center justify-center">
                    {watchedEpisodes[selectedSeason]?.includes(episode.episode_number) ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-primary" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-white/30" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-primary">E{episode.episode_number}</span>
                      <h4 className="font-medium text-sm text-white truncate">{episode.name}</h4>
                    </div>
                    <p className="text-xs text-brand-text-dim mt-0.5">{airDate}</p>
                    {episode.overview && (
                      <div className="hidden md:block">
                        <p
                          className={`text-xs text-brand-text-dim mt-2 leading-relaxed ${!isExpanded && needsTruncation ? "line-clamp-2" : ""
                            }`}
                        >
                          {episode.overview}
                        </p>
                        {needsTruncation && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleOverview(episode.id);
                            }}
                            className="text-xs font-medium text-brand-primary hover:underline mt-1"
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ? "Less" : "More"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Watched indicator on desktop - shows at right */}
                  <div className="hidden md:flex flex-shrink-0 pt-1">
                    {watchedEpisodes[selectedSeason]?.includes(episode.episode_number) && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-primary" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };
