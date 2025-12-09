import { memo } from "react";
import { MediaCard } from "./MediaCard";
import type { Media } from "../../types/types";

interface MediaGridProps {
  mediaItems: Media[];
  onCardClick: (media: Media, rect: DOMRect) => void;
  watchlistIds: Set<number>;
  progressMap?: Record<string, number>;
  selectedMediaId: string | null;
}

export const MediaGrid = memo<MediaGridProps>(({
  mediaItems,
  onCardClick,
  watchlistIds,
  progressMap,
  selectedMediaId,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
      {mediaItems.map((item) => (
        <MediaCard
          key={`${item.media_type}-${item.id}`}
          media={item}
          onClick={onCardClick}
          isInWatchlist={watchlistIds.has(item.id)}
          progress={progressMap ? progressMap[item.id] : undefined}
          isDimmed={selectedMediaId === `${item.media_type}-${item.id}`}
        />
      ))}
    </div>
  );
});
