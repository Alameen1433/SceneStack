import React from "react";

interface ShowMoreCardProps {
    remainingCount: number;
    onClick: () => void;
}

export const ShowMoreCard: React.FC<ShowMoreCardProps> = ({
    remainingCount,
    onClick,
}) => {
    return (
        <div
            className="cursor-pointer transform transition-transform duration-300 hover:scale-105"
            onClick={onClick}
            role="button"
            aria-label={`View ${remainingCount} more items`}
        >
            <div className="relative rounded-xl overflow-hidden shadow-lg bg-brand-surface/50 backdrop-blur-sm aspect-[2/3] flex flex-col items-center justify-center gap-3 border border-white/10 hover:border-white/20 hover:bg-brand-surface/70 transition-all duration-300">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 opacity-50" />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center gap-2">
                    {/* Count badge */}
                    <span className="text-2xl sm:text-3xl font-bold text-brand-text-light">
                        +{remainingCount}
                    </span>

                    {/* Arrow icon */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-brand-primary/30 flex items-center justify-center backdrop-blur-sm">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 sm:h-7 sm:w-7 text-brand-text-light"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </div>

                    {/* Label */}
                    <span className="text-xs sm:text-sm text-brand-text-dim font-medium">
                        View All
                    </span>
                </div>
            </div>
        </div>
    );
};
