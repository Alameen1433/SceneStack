import React, { useMemo, useState, useEffect } from "react";
import { TMDB_IMAGE_BASE_URL } from "../../constants/constants";
import type {
  MovieDetail,
  TVDetail,
  WatchlistItem,
  SeasonDetail,
  //Video,
  WatchProvider,
  WatchProviderCountry,
} from "../../types/types";
import { EpisodeTracker } from "../features/EpisodeTracker";
import { getWatchProviders, getBestLogo, getBestTrailer, combineRentBuyProviders } from "../../services/tmdbService";
import { FiImage, FiArrowLeft, FiExternalLink, FiPlus, FiCheck, FiPlay, FiCheckCircle } from "react-icons/fi";

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
    <FiImage className="w-12 h-12 text-brand-text-dim" />
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
    return getBestLogo(media.images?.logos);
  }, [media.images]);

  const logoUrl = logo
    ? `${TMDB_IMAGE_BASE_URL.replace("w500", "original")}${logo.file_path}`
    : "";

  const rentOrBuyProviders = useMemo(() => {
    return combineRentBuyProviders(providers);
  }, [providers]);

  useEffect(() => {
    const fetchProviders = async () => {
      setIsLoadingProviders(true);
      setProviders(null);
      try {
        const response = await getWatchProviders(media.id, media.media_type);
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

  // Lock body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const trailer = useMemo(() => {
    return getBestTrailer(media.videos);
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
            <FiArrowLeft className="h-6 w-6" />
          </button>
          <a
            href={`https://www.themoviedb.org/${media.media_type}/${media.id}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on TMDB"
            title="View on TMDB"
            className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light hover:bg-white/10 transition-colors"
          >
            <FiExternalLink className="h-6 w-6" />
          </a>
        </header>

        <main
          className={`flex-grow overflow-y-auto w-full max-w-7xl mx-auto grid ${media.media_type === "tv" && watchlistItem?.media_type === "tv"
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

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                {/* Watchlist Toggle - Primary Action */}
                <button
                  onClick={() => onToggleWatchlist(media)}
                  className={`flex-1 min-w-[140px] py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${isInWatchlist
                    ? "bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 border border-white/10"
                    : "bg-brand-primary hover:bg-brand-secondary text-brand-bg shadow-lg shadow-brand-primary/20"
                    }`}
                >
                  {isInWatchlist ? (
                    <>
                      <FiCheck className="h-5 w-5" />
                      <span className="hidden sm:inline">Remove</span>
                    </>
                  ) : (
                    <>
                      <FiPlus className="h-5 w-5" />
                      <span>Add to List</span>
                    </>
                  )}
                </button>

                {/* Watch Trailer */}
                {trailer && (
                  <a
                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[140px] py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/10"
                  >
                    <FiPlay className="h-5 w-5" />
                    <span>Trailer</span>
                  </a>
                )}

                {/* Mark as Watched (Movies only) */}
                {media.media_type === "movie" && isInWatchlist && watchlistItem?.media_type === "movie" && (
                  <button
                    onClick={() => onToggleMovieWatched(media.id)}
                    className={`flex-1 min-w-[140px] py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 border ${watchlistItem.watched
                      ? "bg-brand-primary/20 border-brand-primary text-brand-primary"
                      : "bg-white/10 hover:bg-white/15 text-white border-white/10"
                      }`}
                  >
                    <FiCheckCircle className="h-5 w-5" />
                    <span>{watchlistItem.watched ? "Watched" : "Mark Watched"}</span>
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
