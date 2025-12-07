import React, { useEffect, useState, useMemo } from "react";

const ConfettiPiece: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div className="absolute w-2 h-4 rounded-sm" style={style}></div>
);

export const Confetti: React.FC<{ onComplete: () => void }> = ({
  onComplete,
}) => {
  const [pieces, setPieces] = useState<React.CSSProperties[]>([]);

  const colors = useMemo(
    () => [
      "#3B82F6",
      "#4F46E5", 
      "#FBBF24", 
      "#EC4899", 
      "#10B981", 
    ],
    []
  );

  useEffect(() => {
    const newPieces = Array.from({ length: 150 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${-20 + Math.random() * -80}px`,
      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      transform: `rotate(${Math.random() * 360}deg)`,
      animation: `fall ${2.5 + Math.random() * 2}s linear forwards`,
      animationDelay: `${Math.random() * 1}s`,
    }));
    setPieces(newPieces);

    const timer = setTimeout(onComplete, 5000);
    return () => clearTimeout(timer);
  }, [onComplete, colors]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((style, i) => (
        <ConfettiPiece key={i} style={style} />
      ))}
      <style>
        {`
                @keyframes fall {
                    to {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
                `}
      </style>
    </div>
  );
};
