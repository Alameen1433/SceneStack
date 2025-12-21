import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
    }, [tvShow.id, tvShow.seasons]);

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

    const airedEpisodesInSeason =
      seasonData?.episodes
        .filter((e) => e.air_date && new Date(e.air_date) <= new Date())
        .map((e) => e.episode_number) ?? [];
    const watchedInSeason = watchedEpisodes[selectedSeason] ?? [];
    const isSeasonWatched =
      airedEpisodesInSeason.length > 0 &&
      airedEpisodesInSeason.every((ep) => watchedInSeason.includes(ep));

    const handleMarkAll = () => {
      if (!isSeasonWatched) {
        setShowConfetti(true);
      }
      onToggleSeasonWatched(tvShow.id, selectedSeason, airedEpisodesInSeason);
    };

    const handleEpisodeToggle = (episodeNumber: number) => {
      const isCurrentlyWatched = watchedInSeason.includes(episodeNumber);
      if (!isCurrentlyWatched) {
        const willComplete = airedEpisodesInSeason.every(
          (ep) => ep === episodeNumber || watchedInSeason.includes(ep)
        );
        if (willComplete) {
          setShowConfetti(true);
        }
      }
      onToggleEpisode(tvShow.id, selectedSeason, episodeNumber);
    };

    return (
      <div className="relative flex flex-col h-full">
        {showConfetti && createPortal(
          <Confetti onComplete={() => setShowConfetti(false)} />,
          document.body
        )}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-grow">
            <select
              value={selectedSeason}
              onChange={handleSeasonChange}
              className="w-full appearance-none bg-brand-surface border border-white/20 text-white rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              aria-label="Select season"
            >
              {tvShow.seasons
                .filter((s) => s.episode_count > 0 && s.name)
                .map((season) => (
                  <option key={season.id} value={season.season_number} className="bg-brand-surface text-white">
                    {season.name}
                  </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <FiChevronDown className="h-4 w-4" />
            </div>
          </div>
          {seasonData && airedEpisodesInSeason.length > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex-shrink-0 py-2 px-3 text-xs font-semibold rounded-md transition-colors bg-white/10 hover:bg-white/20 text-white"
              aria-label={
                isSeasonWatched
                  ? "Mark all aired episodes as unwatched"
                  : "Mark all aired episodes as watched"
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

              const isUnaired = episode.air_date
                ? new Date(episode.air_date) > new Date()
                : true;

              return (
                <li
                  key={episode.id}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${isUnaired
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-white/10 active:bg-white/15 cursor-pointer'}`}
                  onClick={() => {
                    if (!isUnaired) {
                      handleEpisodeToggle(episode.episode_number);
                    }
                  }}
                >
                  {/* Episode image - compact on mobile */}
                  <div className="flex-shrink-0">
                    {episode.still_path ? (
                      <img
                        src={`${TMDB_IMAGE_BASE_URL.replace("w500", "w300")}${episode.still_path}`}
                        alt={`Still from ${episode.name}`}
                        className="w-16 h-10 md:w-28 md:h-16 object-cover rounded-lg bg-brand-surface"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-16 h-10 md:w-28 md:h-16 bg-brand-surface rounded-lg flex items-center justify-center">
                        <FiImage className="w-4 h-4 md:w-6 md:h-6 text-brand-text-dim" />
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
                      {isUnaired && <span className="ml-2 text-yellow-400">(Upcoming)</span>}
                    </p>
                    {episode.overview && (
                      <div className="hidden md:block">
                        <p
                          className="text-xs text-brand-text-dim mt-2 leading-relaxed"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: isExpanded ? 'unset' : 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: isExpanded ? 'visible' : 'hidden',
                          }}
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

                  {/* Watched indicator - shows at right */}
                  <div className="flex-shrink-0 pt-1">
                    {watchedEpisodes[selectedSeason]?.includes(episode.episode_number) ? (
                      <FiCheck className="h-5 w-5 text-brand-primary" />
                    ) : !isUnaired ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white/30" />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };
