import React, { useEffect, useState, useMemo, useRef } from "react";

const ConfettiPiece: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div className="absolute w-2 h-4 rounded-sm" style={style}></div>
);

export const Confetti: React.FC<{ onComplete: () => void }> = ({
  onComplete,
}) => {
  const [pieces, setPieces] = useState<React.CSSProperties[]>([]);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const colors = useMemo(
    () => ["#3B82F6", "#4F46E5", "#FBBF24", "#EC4899", "#10B981"],
    []
  );

  useEffect(() => {
    const newPieces = Array.from({ length: 150 }).map((_, i) => {
      const isLeft = i < 75;
      const startX = isLeft ? -5 : 105;
      const endX = 20 + Math.random() * 60;
      const endY = 30 + Math.random() * 50;

      return {
        left: `${startX}%`,
        bottom: `${Math.random() * 20}%`,
        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
        transform: `rotate(${Math.random() * 360}deg)`,
        "--end-x": `${endX}vw`,
        "--end-y": `${endY}vh`,
        animation: `burst-${isLeft ? "left" : "right"} ${2 + Math.random() * 1.5}s ease-out forwards`,
        animationDelay: `${Math.random() * 0.3}s`,
      } as React.CSSProperties;
    });
    setPieces(newPieces);

    const timer = setTimeout(() => onCompleteRef.current(), 4000);
    return () => clearTimeout(timer);
  }, [colors]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((style, i) => (
        <ConfettiPiece key={i} style={style} />
      ))}
      <style>
        {`
          @keyframes burst-left {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
            100% { transform: translate(var(--end-x), calc(-1 * var(--end-y))) rotate(720deg); opacity: 0; }
          }
          @keyframes burst-right {
            0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
            100% { transform: translate(calc(-1 * var(--end-x)), calc(-1 * var(--end-y))) rotate(-720deg); opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};
