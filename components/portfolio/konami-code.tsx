"use client";

import { useEffect, useState, useCallback } from "react";

const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA",
];

export function KonamiCode() {
  const [keysPressed, setKeysPressed] = useState<string[]>([]);
  const [activated, setActivated] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const newKeys = [...keysPressed, e.code].slice(-KONAMI_CODE.length);
      setKeysPressed(newKeys);

      if (newKeys.join(",") === KONAMI_CODE.join(",")) {
        setActivated(true);
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 5000);
      }
    },
    [keysPressed]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!activated) return null;

  return (
    <>
      {/* Confetti-like particles */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Message */}
      {showMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-8 py-4 bg-primary text-primary-foreground rounded-xl shadow-2xl animate-bounce-in">
          <p className="text-lg font-bold text-center">
            Achievement Unlocked: Code Master!
          </p>
          <p className="text-sm text-center opacity-80">
            You found the secret Konami Code easter egg!
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes bounce-in {
          0% {
            transform: translateX(-50%) scale(0.5);
            opacity: 0;
          }
          50% {
            transform: translateX(-50%) scale(1.05);
          }
          100% {
            transform: translateX(-50%) scale(1);
            opacity: 1;
          }
        }
        .animate-confetti {
          animation: confetti 4s ease-in forwards;
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out forwards;
        }
      `}</style>
    </>
  );
}
