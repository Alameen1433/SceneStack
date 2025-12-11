import React, { memo } from "react";
import { FiImage, FiCheck, FiPlay } from "react-icons/fi";
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
    <FiImage className="w-10 h-10 text-brand-text-dim" />
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



  return (
    <div
      className="cursor-pointer transform transition-transform duration-300 hover:scale-105"
      onClick={(e) => onClick(media, e.currentTarget.getBoundingClientRect())}
      role="button"
      aria-label={`View details for ${title}`}
      style={{ opacity: isDimmed ? 0 : 1, transition: "opacity 0.3s" }}
    >
      <div className="relative rounded-lg overflow-hidden shadow-lg bg-brand-surface aspect-[2/3] ring-1 ring-white/5 group-hover:ring-brand-primary/30 transition-all">
        {media.poster_path ? (
          <img
            src={`${TMDB_IMAGE_BASE_URL}${media.poster_path}`}
            srcSet={`
              ${TMDB_IMAGE_BASE_URL_MOBILE}${media.poster_path} 342w,
              ${TMDB_IMAGE_BASE_URL}${media.poster_path} 500w
            `}
            sizes="(max-width: 768px) 342px, 500px"
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
            <FiCheck className="h-4 w-4" />
          </div>
        )}

        {isCurrentlyWatching && (
          <div
            className="absolute top-2 left-2 bg-brand-surface/90 backdrop-blur-sm text-brand-primary rounded-full p-1.5 shadow-md"
            title="Update progress"
          >
            <FiPlay className="h-4 w-4" />
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

