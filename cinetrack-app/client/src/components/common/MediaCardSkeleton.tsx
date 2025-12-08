import { memo } from "react";

interface MediaCardSkeletonProps {
    /** Number of skeleton cards to render */
    count?: number;
}

const SkeletonCard = memo(() => (
    <div className="relative group cursor-pointer">
        {/* Poster skeleton */}
        <div className="aspect-[2/3] rounded-lg bg-brand-surface overflow-hidden">
            <div className="w-full h-full animate-pulse bg-gradient-to-r from-brand-surface via-white/5 to-brand-surface bg-[length:200%_100%] animate-shimmer" />
        </div>
        {/* Title skeleton */}
        <div className="mt-2 space-y-1.5">
            <div className="h-3 w-3/4 rounded bg-brand-surface animate-pulse" />
            <div className="h-2.5 w-1/2 rounded bg-brand-surface animate-pulse" />
        </div>
    </div>
));

SkeletonCard.displayName = "SkeletonCard";

export const MediaCardSkeleton = memo<MediaCardSkeletonProps>(({ count = 6 }) => (
    <>
        {Array.from({ length: count }).map((_, index) => (
            <SkeletonCard key={index} />
        ))}
        <style>{`
            @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            .animate-shimmer {
                animation: shimmer 1.5s ease-in-out infinite;
            }
        `}</style>
    </>
));

MediaCardSkeleton.displayName = "MediaCardSkeleton";

// Grid skeleton that matches MediaGrid layout
interface MediaGridSkeletonProps {
    count?: number;
}

export const MediaGridSkeleton = memo<MediaGridSkeletonProps>(({ count = 12 }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        <MediaCardSkeleton count={count} />
    </div>
));

MediaGridSkeleton.displayName = "MediaGridSkeleton";

// Horizontal scroll skeleton
interface HorizontalScrollSkeletonProps {
    count?: number;
}

export const HorizontalScrollSkeleton = memo<HorizontalScrollSkeletonProps>(({ count = 8 }) => (
    <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-[140px] sm:w-[160px]">
                <div className="aspect-[2/3] rounded-lg bg-brand-surface overflow-hidden">
                    <div className="w-full h-full animate-pulse bg-gradient-to-r from-brand-surface via-white/5 to-brand-surface bg-[length:200%_100%] animate-shimmer" />
                </div>
                <div className="mt-2 space-y-1.5">
                    <div className="h-3 w-3/4 rounded bg-brand-surface animate-pulse" />
                </div>
            </div>
        ))}
        <style>{`
            @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            .animate-shimmer {
                animation: shimmer 1.5s ease-in-out infinite;
            }
        `}</style>
    </div>
));

HorizontalScrollSkeleton.displayName = "HorizontalScrollSkeleton";
