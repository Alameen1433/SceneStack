import React, { useMemo, useState, useEffect } from "react";
import { TMDB_IMAGE_BASE_URL } from "../constants";
import type {
  MovieDetail,
  TVDetail,
  WatchlistItem,
  SeasonDetail,
  //Video,
  WatchProvider,
  WatchProviderCountry,
} from "../types";
import { EpisodeTracker } from "./EpisodeTracker";
import { getWatchProviders } from "../services/tmdbService";

interface MediaDetailModalProps {
  media: MovieDetail | TVDetail;
  watchlistItem?: WatchlistItem;
  watchlistIds: Set<number>;
  onClose: () => void;
  onToggleWatchlist: (media: MovieDetail | TVDetail) => void;
  onToggleMovieWatched: (movieId: number) => void;
  onToggleEpisodeWatched: (
    tvId: number,
    seasonNumber: number,
    episodeNumber: number
  ) => void;
  getSeasonDetails: (
    tvId: number,
    seasonNumber: number
  ) => Promise<SeasonDetail>;
  onSearch: (query: string) => void;
  onToggleSeasonWatched: (
    tvId: number,
    seasonNumber: number,
    episodeNumbers: number[]
  ) => void;
  onUpdateTags: (mediaId: number, newTags: string[]) => void;
}

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div>
    <h3 className="text-sm font-semibold uppercase tracking-widest text-brand-text-dim mb-2">
      {title}
    </h3>
    {children}
  </div>
);

const PosterPlaceholder: React.FC = () => (
  <div className="aspect-[2/3] w-full bg-brand-surface flex items-center justify-center rounded-lg">
    <svg
      className="w-12 h-12 text-brand-text-dim"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15 10l4.55a2.5 2.5 0 010 4.09L15 18M3 8a2 2 0 012-2h5.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V18a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
      ></path>
    </svg>
  </div>
);

const ProviderList: React.FC<{
  title: string;
  providers: WatchProvider[];
  link: string;
}> = ({ title, providers, link }) => (
  <div className="mb-3">
    <h4 className="text-md font-semibold text-brand-text-light mb-2">
      {title}
    </h4>
    <div className="flex flex-wrap gap-2">
      {providers.map((p) => (
        <a
          href={link}
          key={p.provider_id}
          target="_blank"
          rel="noopener noreferrer"
          title={p.provider_name}
          className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-primary rounded-lg"
        >
          <img
            src={`${TMDB_IMAGE_BASE_URL}${p.logo_path}`}
            alt={p.provider_name}
            className="w-10 h-10 rounded-lg object-cover bg-white"
            loading="lazy"
          />
        </a>
      ))}
    </div>
  </div>
);

const TagManager: React.FC<{
  tags: string[];
  onUpdateTags: (newTags: string[]) => void;
}> = ({ tags, onUpdateTags }) => {
  const [inputValue, setInputValue] = useState("");

  const handleAddTag = () => {
    const newTag = inputValue.trim().toLowerCase();
    if (newTag && !tags.includes(newTag)) {
      onUpdateTags([...tags, newTag]);
    }
    setInputValue("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <DetailSection title="Tags">
      <div className="flex flex-wrap gap-2 items-center">
        {tags.map((tag) => (
          <div
            key={tag}
            className="flex items-center gap-1 bg-brand-secondary/50 px-3 py-1 rounded-full text-sm"
          >
            <span className="capitalize">{tag}</span>
            <button
              onClick={() => handleRemoveTag(tag)}
              className="text-white/70 hover:text-white"
              aria-label={`Remove tag ${tag}`}
            >
              &times;
            </button>
          </div>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleAddTag}
          placeholder="Add a tag..."
          className="bg-transparent focus:outline-none text-sm w-24"
        />
      </div>
    </DetailSection>
  );
};

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  media,
  watchlistIds,
  onClose,
  onToggleWatchlist,
  getSeasonDetails,
  watchlistItem,
  onToggleMovieWatched,
  onToggleEpisodeWatched,
  //onSearch,
  onToggleSeasonWatched,
  onUpdateTags,
}) => {
  const isInWatchlist = watchlistIds.has(media.id);
  const title = media.media_type === "movie" ? media.title : media.name;
  const cast = media.credits?.cast.slice(0, 5);
  const backdropUrl = media.backdrop_path
    ? `${TMDB_IMAGE_BASE_URL.replace("w500", "original")}${media.backdrop_path}`
    : "";

  const [providers, setProviders] = useState<WatchProviderCountry | null>(null);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);

  const logo = useMemo(() => {
    const logos = media.images?.logos;
    if (!logos || logos.length === 0) return null;

    // Prioritize English SVG
    let bestLogo = logos.find(
      (l) => l.iso_639_1 === "en" && l.file_path.endsWith(".svg")
    );
    if (bestLogo) return bestLogo;

    // Any SVG
    bestLogo = logos.find((l) => l.file_path.endsWith(".svg"));
    if (bestLogo) return bestLogo;

    // English PNG
    bestLogo = logos.find((l) => l.iso_639_1 === "en");
    if (bestLogo) return bestLogo;

    // First available logo
    return logos[0];
  }, [media.images]);

  const logoUrl = logo
    ? `${TMDB_IMAGE_BASE_URL.replace("w500", "original")}${logo.file_path}`
    : "";

  const rentOrBuyProviders = useMemo(() => {
    if (!providers) return [];

    const combined = new Map<number, WatchProvider>();

    (providers.rent || []).forEach((p) => {
      if (!combined.has(p.provider_id)) {
        combined.set(p.provider_id, p);
      }
    });

    (providers.buy || []).forEach((p) => {
      if (!combined.has(p.provider_id)) {
        combined.set(p.provider_id, p);
      }
    });

    return Array.from(combined.values());
  }, [providers]);

  useEffect(() => {
    const fetchProviders = async () => {
      setIsLoadingProviders(true);
      setProviders(null);
      try {
        const response = await getWatchProviders(media.id, media.media_type);
        // We'll focus on US providers for this app.
        if (response.results.US) {
          setProviders(response.results.US);
        }
      } catch (error) {
        console.error("Failed to fetch watch providers", error);
      } finally {
        setIsLoadingProviders(false);
      }
    };

    fetchProviders();
  }, [media.id, media.media_type]);

  const trailer = useMemo(() => {
    const videos = media.videos?.results;
    if (!videos) return null;

    const youtubeVideos = videos.filter((v) => v.site === "YouTube");

    const officialTrailer = youtubeVideos.find(
      (v) => v.type === "Trailer" && v.official
    );
    if (officialTrailer) return officialTrailer;

    const anyTrailer = youtubeVideos.find((v) => v.type === "Trailer");
    if (anyTrailer) return anyTrailer;

    const officialTeaser = youtubeVideos.find(
      (v) => v.type === "Teaser" && v.official
    );
    if (officialTeaser) return officialTeaser;

    const anyTeaser = youtubeVideos.find((v) => v.type === "Teaser");
    if (anyTeaser) return anyTeaser;

    return null;
  }, [media.videos]);

  const releaseYears = () => {
    if (media.media_type === "movie") {
      return media.release_date
        ? new Date(media.release_date).getFullYear()
        : "N/A";
    }
    const tvMedia = media as TVDetail;
    const startYear = tvMedia.first_air_date
      ? new Date(tvMedia.first_air_date).getFullYear()
      : "";
    const endYear =
      tvMedia.last_air_date && tvMedia.status === "Ended"
        ? new Date(tvMedia.last_air_date).getFullYear()
        : "";

    if (startYear && !endYear) {
      return `${startYear}–`;
    }
    if (startYear === endYear) return startYear;
    return `${startYear}–${endYear}`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 text-brand-text-light font-sans overflow-hidden animate-fade-in">
      {backdropUrl && (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-500"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        />
      )}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-black/95 via-black/80 to-transparent" />

      <div className="relative z-10 h-full flex flex-col">
        <header className="flex justify-between items-center p-4 sm:p-6 lg:p-8">
          <button
            onClick={onClose}
            aria-label="Go back"
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <a
            href={`https://www.themoviedb.org/${media.media_type}/${media.id}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on TMDB"
            title="View on TMDB"
            className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light hover:bg-white/10 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </header>

        <main
          className={`flex-grow overflow-y-auto w-full max-w-7xl mx-auto grid ${
            media.media_type === "tv" && watchlistItem?.media_type === "tv"
              ? "grid-cols-1 lg:grid-cols-[minmax(0,_2fr)_minmax(0,_1.5fr)]"
              : "grid-cols-1"
          } gap-8 p-4 sm:p-6 lg:p-8`}
        >
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-auto md:max-w-[300px] flex-shrink-0 mx-auto hidden md:block">
              {media.poster_path ? (
                <img
                  src={`${TMDB_IMAGE_BASE_URL}${media.poster_path}`}
                  alt={`Poster for ${title}`}
                  className="rounded-lg shadow-lg w-full aspect-[2/3] object-cover"
                />
              ) : (
                <PosterPlaceholder />
              )}
            </div>

            <div className="flex-grow flex flex-col justify-center space-y-4 md:space-y-6 lg:space-y-8">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${title} logo`}
                  className="max-h-24 md:max-h-32 w-auto object-contain self-start drop-shadow-lg"
                />
              ) : (
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-wider text-white [text-shadow:_2px_2px_4px_rgb(0_0_0_/_50%)]">
                  {title}
                </h1>
              )}

              <div className="flex items-center gap-4 sm:gap-6 text-brand-text-dim">
                {media.media_type === "movie" && (
                  <span>{media.runtime} min</span>
                )}
                <span>{releaseYears()}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-white">
                    {media.vote_average.toFixed(1)}
                  </span>
                  <span className="bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-sm">
                    IMDb
                  </span>
                </div>
              </div>

              <DetailSection title="Genres">
                <div className="flex flex-wrap gap-2">
                  {media.genres.map((g) => (
                    <span
                      key={g.id}
                      className="bg-white/10 px-3 py-1 rounded-full text-sm"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              </DetailSection>

              {cast && cast.length > 0 && (
                <DetailSection title="Cast">
                  <div className="flex flex-wrap gap-2">
                    {cast.map((c) => (
                      <a
                        key={c.id}
                        href={`https://www.google.com/search?q=${encodeURIComponent(
                          c.name + " actor"
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/10 px-3 py-1 rounded-full text-sm hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      >
                        {c.name}
                      </a>
                    ))}
                  </div>
                </DetailSection>
              )}

              <DetailSection title="Summary">
                <p className="text-brand-text-light leading-relaxed max-h-24 overflow-y-auto">
                  {media.overview}
                </p>
              </DetailSection>

              <DetailSection title="Where to Watch">
                {isLoadingProviders ? (
                  <p className="text-sm text-brand-text-dim animate-pulse">
                    Loading providers...
                  </p>
                ) : providers &&
                  (providers.flatrate?.length ||
                    rentOrBuyProviders.length > 0) ? (
                  <div>
                    {providers.flatrate && providers.flatrate.length > 0 && (
                      <ProviderList
                        title="Stream"
                        providers={providers.flatrate}
                        link={providers.link}
                      />
                    )}
                    {rentOrBuyProviders.length > 0 && (
                      <ProviderList
                        title="Rent or Buy"
                        providers={rentOrBuyProviders}
                        link={providers.link}
                      />
                    )}
                    <p className="text-xs text-brand-text-dim mt-3">
                      Provider information provided by{" "}
                      <a
                        href={providers.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-brand-primary"
                      >
                        JustWatch
                      </a>
                      . Availability may vary.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-brand-text-dim">
                    Watch provider information not available.
                  </p>
                )}
              </DetailSection>

              {isInWatchlist && watchlistItem && (
                <TagManager
                  tags={watchlistItem.tags || []}
                  onUpdateTags={(newTags) => onUpdateTags(media.id, newTags)}
                />
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {trailer && (
                  <a
                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center bg-brand-primary hover:bg-brand-secondary text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Watch Trailer
                  </a>
                )}
                <button
                  onClick={() => onToggleWatchlist(media)}
                  className="flex-1 text-center bg-transparent border-2 border-white hover:bg-white hover:text-black text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isInWatchlist ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Remove from Watchlist
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Add to Watchlist
                    </>
                  )}
                </button>
                {media.media_type === "movie" &&
                  isInWatchlist &&
                  watchlistItem?.media_type === "movie" && (
                    <button
                      onClick={() => onToggleMovieWatched(media.id)}
                      className="flex-1 text-center bg-transparent border-2 border-white/80 hover:bg-white hover:text-black text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {watchlistItem.watched ? (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Mark as Unwatched
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Mark as Watched
                        </>
                      )}
                    </button>
                  )}
              </div>
            </div>
          </div>
          {media.media_type === "tv" && watchlistItem?.media_type === "tv" && (
            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 lg:max-h-[80vh] flex flex-col">
              <EpisodeTracker
                tvShow={media}
                getSeasonDetails={getSeasonDetails}
                watchedEpisodes={watchlistItem.watchedEpisodes}
                onToggleEpisode={onToggleEpisodeWatched}
                onToggleSeasonWatched={onToggleSeasonWatched}
              />
            </div>
          )}
        </main>
      </div>
      <style>{`
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                /* Custom scrollbar for webkit browsers */
                .overflow-y-auto::-webkit-scrollbar {
                    width: 8px;
                }
                .overflow-y-auto::-webkit-scrollbar-track {
                    background: transparent;
                }
                .overflow-y-auto::-webkit-scrollbar-thumb {
                    background-color: rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                }
                .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(255, 255, 255, 0.4);
                }
            `}</style>
    </div>
  );
};
