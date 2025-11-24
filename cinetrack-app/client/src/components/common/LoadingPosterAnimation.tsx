import React, { useEffect, useState, useMemo } from "react";
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

  const [styles, setStyles] = useState<React.CSSProperties>({
    position: "fixed",
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    transition: "all 0.5s cubic-bezier(0.65, 0, 0.35, 1)",
    zIndex: 50,
    borderRadius: "0.75rem", // 12px, same as MediaCard
    overflow: "hidden",
    willChange: "top, left, width, height, transform, box-shadow",
  });
  const [backdropOpacity, setBackdropOpacity] = useState(0);
  const [spinnerOpacity, setSpinnerOpacity] = useState(0);

  useEffect(() => {
    requestAnimationFrame(() => {
      setStyles((prev) => ({
        ...prev,
        top: "50%",
        left: "50%",
        width: targetWidth,
        height: targetWidth * 1.5,
        transform: "translate(-50%, -50%)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
      }));
      setBackdropOpacity(0.8);
      setSpinnerOpacity(1);
    });
  }, [targetWidth]);

  return (
    <div
      className="fixed inset-0 z-40"
      aria-hidden="true"
      role="status"
      aria-label="Loading details"
    >
      <div
        className="absolute inset-0 bg-brand-bg"
        style={{
          opacity: backdropOpacity,
          transition: "opacity 0.4s ease-in-out",
        }}
      />
      <div style={styles}>
        {media.poster_path ? (
          <img
            src={`${TMDB_IMAGE_BASE_URL}${media.poster_path}`}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-brand-surface" />
        )}
        <div
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20"
          style={{ opacity: spinnerOpacity, transition: "opacity 0.3s 0.2s" }}
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
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      </div>
    </div>
  );
};
