import React, { memo, useMemo } from "react";
import { TMDB_IMAGE_BASE_URL, TMDB_IMAGE_BASE_URL_MOBILE } from "../../constants/constants";
import type { Media } from "../../types/types";

interface MediaCardProps {
  media: Media;
  onClick: (media: Media, rect: DOMRect) => void;
  isInWatchlist: boolean;
  progress?: number;
  isDimmed: boolean;
}

const MediaPlaceholder: React.FC = () => (
  <div className="w-full h-full bg-brand-surface flex items-center justify-center">
    <svg
      className="w-10 h-10 text-brand-text-dim"
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

const MediaCardComponent: React.FC<MediaCardProps> = ({
  media,
  onClick,
  isInWatchlist,
  progress,
  isDimmed,
}) => {
  const title = media.media_type === "movie" ? media.title : media.name;
  const isCurrentlyWatching = progress !== undefined && progress > 0;

  const imageUrl = useMemo(() => {
    if (!media.poster_path) return null;
    const isMobile = window.innerWidth < 768;
    const baseUrl = isMobile ? TMDB_IMAGE_BASE_URL_MOBILE : TMDB_IMAGE_BASE_URL;
    return `${baseUrl}${media.poster_path}`;
  }, [media.poster_path]);

  return (
    <div
      className="cursor-pointer transform transition-transform duration-300 hover:scale-105"
      onClick={(e) => onClick(media, e.currentTarget.getBoundingClientRect())}
      role="button"
      aria-label={`View details for ${title}`}
      style={{ opacity: isDimmed ? 0 : 1, transition: "opacity 0.3s" }}
    >
      <div className="relative rounded-lg overflow-hidden shadow-lg bg-brand-surface aspect-[2/3] ring-1 ring-white/5 group-hover:ring-brand-primary/30 transition-all">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`Poster for ${title}`}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <MediaPlaceholder />
        )}

        {isCurrentlyWatching && (
          <div
            className="absolute bottom-0 left-0 w-full h-1.5 bg-white/20"
            title={`Progress: ${Math.floor(progress)}%`}
          >
            <div
              className="h-full bg-brand-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        {isInWatchlist && (
          <div className="absolute top-2 right-2 bg-brand-primary/90 backdrop-blur-sm text-brand-bg rounded-full p-1.5 shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}

        {isCurrentlyWatching && (
          <div
            className="absolute top-2 left-2 bg-brand-surface/90 backdrop-blur-sm text-brand-primary rounded-full p-1.5 shadow-md"
            title="Update progress"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export const MediaCard = memo(MediaCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.media.id === nextProps.media.id &&
    prevProps.isInWatchlist === nextProps.isInWatchlist &&
    prevProps.progress === nextProps.progress &&
    prevProps.isDimmed === nextProps.isDimmed
  );
});

