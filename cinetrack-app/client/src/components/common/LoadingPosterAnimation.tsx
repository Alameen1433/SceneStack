import { useEffect, useState, useMemo } from "react";
import { TMDB_IMAGE_BASE_URL } from "../../constants/constants";
import type { Media } from "../../types/types";

interface LoadingPosterAnimationProps {
  media: Media;
  rect: DOMRect;
}

export const LoadingPosterAnimation: React.FC<LoadingPosterAnimationProps> = ({
  media,
  rect,
}) => {
  const targetWidth = useMemo(
    () => Math.min(250, window.innerWidth * 0.65),
    []
  );

  // Calculate the center of the viewport
  const viewportCenterX = window.innerWidth / 2;
  const viewportCenterY = window.innerHeight / 2;

  // Calculate scale factor (from original size to target size)
  const scaleX = targetWidth / rect.width;
  const scaleY = (targetWidth * 1.5) / rect.height;
  const scale = Math.min(scaleX, scaleY);

  // Calculate translation to move from original position to center
  // We need to account for the element's own center
  const originalCenterX = rect.left + rect.width / 2;
  const originalCenterY = rect.top + rect.height / 2;
  const translateX = viewportCenterX - originalCenterX;
  const translateY = viewportCenterY - originalCenterY;

  const [isAnimating, setIsAnimating] = useState(false);
  const [backdropOpacity, setBackdropOpacity] = useState(0);
  const [spinnerOpacity, setSpinnerOpacity] = useState(0);

  useEffect(() => {
    // Use double RAF to ensure the initial state is painted first
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsAnimating(true);
        setBackdropOpacity(0.8);
        setSpinnerOpacity(1);
      });
    });
  }, []);

  return (
    <div
      className="fixed inset-0 z-40"
      aria-hidden="true"
      role="status"
      aria-label="Loading details"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-bg"
        style={{
          opacity: backdropOpacity,
          transition: "opacity 0.4s ease-in-out",
        }}
      />

      {/* Animated poster - using transform for GPU compositing */}
      <div
        style={{
          position: "fixed",
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          // GPU-composited properties only
          transform: isAnimating
            ? `translate(${translateX}px, ${translateY}px) scale(${scale})`
            : "translate(0, 0) scale(1)",
          transition: "transform 0.5s cubic-bezier(0.65, 0, 0.35, 1), box-shadow 0.5s ease-out",
          transformOrigin: "center center",
          zIndex: 50,
          borderRadius: "0.75rem",
          overflow: "hidden",
          boxShadow: isAnimating
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            : "none",
          // Only hint transform for GPU layer promotion
          willChange: "transform",
        }}
      >
        {media.poster_path ? (
          <img
            src={`${TMDB_IMAGE_BASE_URL}${media.poster_path}`}
            alt=""
            className="w-full h-full object-cover"
            // Prevent image from blocking compositing
            style={{ transform: "translateZ(0)" }}
          />
        ) : (
          <div className="w-full h-full bg-brand-surface" />
        )}

        {/* Loading spinner overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/20"
          style={{
            opacity: spinnerOpacity,
            transition: "opacity 0.3s ease-out 0.2s",
          }}
        >
          <svg
            className="animate-spin h-10 w-10 text-white"
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
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
