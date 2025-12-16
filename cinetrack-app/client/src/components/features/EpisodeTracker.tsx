import React, { useState, useEffect, useCallback, useRef } from "react";
import { FiChevronDown, FiLoader, FiImage, FiCheck } from "react-icons/fi";
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
      prevWatchedRef.current = watchedEpisodes;
    }, [tvShow.id, tvShow.seasons]);

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
      setSeasonData(null);
      setExpandedOverviews(new Set());
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const releasedEpisodes = seasonData?.episodes.filter((e) => {
      if (!e.air_date) return false;
      const airDate = new Date(e.air_date);
      return airDate <= today;
    }) ?? [];

    const allReleasedEpisodeNumbers = releasedEpisodes.map((e) => e.episode_number);
    const watchedInSeason = watchedEpisodes[selectedSeason] ?? [];
    const isSeasonWatched =
      allReleasedEpisodeNumbers.length > 0 &&
      watchedInSeason.length >= allReleasedEpisodeNumbers.length;

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
              <FiChevronDown className="h-4 w-4" />
            </div>
          </div>
          {seasonData && (
            <button
              onClick={() =>
                onToggleSeasonWatched(
                  tvShow.id,
                  selectedSeason,
                  allReleasedEpisodeNumbers
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
            <FiLoader className="animate-spin h-8 w-8 text-white" />
          </div>
        )}

        {!isLoading && seasonData && (
          <ul className="space-y-3 overflow-y-auto flex-grow pr-2">
            {seasonData.episodes.map((episode) => {
              const episodeAirDate = episode.air_date ? new Date(episode.air_date) : null;
              const isReleased = episodeAirDate ? episodeAirDate <= today : false;
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
                  className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${isReleased
                      ? "hover:bg-white/10 active:bg-white/15 cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                    }`}
                  onClick={() => {
                    if (isReleased) {
                      onToggleEpisode(
                        tvShow.id,
                        selectedSeason,
                        episode.episode_number
                      );
                    }
                  }}
                >
                  {/* Episode image */}
                  <div className="flex-shrink-0">
                    {episode.still_path ? (
                      <img
                        src={`${TMDB_IMAGE_BASE_URL.replace("w500", "w300")}${episode.still_path
                          }`}
                        alt={`Still from ${episode.name}`}
                        className="w-20 h-12 md:w-28 md:h-16 object-cover rounded-lg bg-brand-surface"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-20 h-12 md:w-28 md:h-16 bg-brand-surface rounded-lg flex items-center justify-center">
                        <FiImage className="w-5 h-5 md:w-6 md:h-6 text-brand-text-dim" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-primary">E{episode.episode_number}</span>
                      <h4 className="font-medium text-sm text-white truncate">{episode.name}</h4>
                    </div>
                    <p className="text-xs text-brand-text-dim mt-0.5">
                      {airDate}
                      {!isReleased && <span className="ml-2 text-brand-primary">(Unreleased)</span>}
                    </p>
                    {episode.overview && (
                      <div>
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

                  {/* Watched indicator */}
                  <div className="flex flex-shrink-0 pt-1">
                    {watchedEpisodes[selectedSeason]?.includes(episode.episode_number) && (
                      <FiCheck className="h-5 w-5 text-brand-primary" />
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
