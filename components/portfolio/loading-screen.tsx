"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "complete" | "exit">("loading");
  const [currentText, setCurrentText] = useState(0);

  const loadingTexts = [
    "Initializing portfolio...",
    "Loading experiences...",
    "Preparing projects...",
    "Almost ready...",
  ];

  useEffect(() => {
    const textInterval = setInterval(() => {
      setCurrentText((prev) => (prev + 1) % loadingTexts.length);
    }, 800);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          clearInterval(textInterval);
          setPhase("complete");
          setTimeout(() => {
            setPhase("exit");
            setTimeout(onComplete, 800);
          }, 500);
          return 100;
        }
        return prev + Math.random() * 12 + 3;
      });
    }, 120);

    return () => {
      clearInterval(interval);
      clearInterval(textInterval);
    };
  }, [onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-100 flex items-center justify-center bg-background overflow-hidden",
        phase === "exit" && "animate-loading-exit"
      )}
    >
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid pattern */}
        <div
          className={cn(
            "absolute inset-0 opacity-[0.03] transition-opacity duration-1000",
            phase === "exit" && "opacity-0"
          )}
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                              linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-loading-orb-1" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-loading-orb-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-loading-orb-3" />

        {/* Scanning line effect */}
        <div className="absolute inset-0 animate-loading-scan">
          <div className="h-px w-full bg-linear-to-r from-transparent via-primary/50 to-transparent" />
        </div>
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center z-10">
        {/* Logo Animation */}
        <div className="relative mb-10">
          {/* Multiple spinning rings */}
          <div className="w-32 h-32 relative">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/10" />
            <div
              className="absolute inset-0 rounded-full border-t-2 border-r-2 border-primary animate-spin"
              style={{ animationDuration: "2s" }}
            />
            
            {/* Middle ring - counter rotate */}
            <div className="absolute inset-3 rounded-full border border-accent/20" />
            <div
              className="absolute inset-3 rounded-full border-b-2 border-l-2 border-accent animate-spin-reverse"
              style={{ animationDuration: "1.5s" }}
            />

            {/* Inner ring */}
            <div className="absolute inset-6 rounded-full border border-primary/10" />
            <div
              className="absolute inset-6 rounded-full border-t-2 border-primary/60 animate-spin"
              style={{ animationDuration: "1s" }}
            />

            {/* Core with initials */}
            <div className="absolute inset-9 rounded-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center animate-loading-pulse">
              <span className="text-xl font-bold text-gradient">CE</span>
            </div>
          </div>

          {/* Floating particles around the logo */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary/60"
              style={{
                top: "50%",
                left: "50%",
                transform: `rotate(${i * 45}deg) translateY(-60px)`,
                animation: `loading-particle 2s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}

          {/* Glowing effect */}
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-loading-glow" />
        </div>

        {/* Text with typewriter effect */}
        <div className="text-center mb-8 h-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gradient mb-3 animate-loading-text-reveal">
            Clarence Espanol
          </h2>
          <div className="h-6 overflow-hidden">
            <p
              className={cn(
                "text-muted-foreground text-sm font-mono transition-all duration-300",
                phase === "complete" ? "text-primary" : ""
              )}
            >
              {phase === "complete" ? "Welcome to my portfolio!" : loadingTexts[currentText]}
            </p>
          </div>
        </div>

        {/* Progress bar with glow effect */}
        <div className="relative w-64">
          {/* Glow behind progress bar */}
          <div
            className="absolute -inset-1 bg-linear-to-r from-primary/20 via-accent/20 to-primary/20 rounded-full blur-md transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
          
          {/* Background track */}
          <div className="relative h-1.5 bg-secondary rounded-full overflow-hidden">
            {/* Progress fill */}
            <div
              className="h-full bg-linear-to-r from-primary via-accent to-primary rounded-full transition-all duration-200 ease-out animate-gradient"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="h-full w-10 bg-linear-to-r from-transparent via-white/20 to-transparent animate-loading-shimmer" />
            </div>
          </div>
        </div>

        {/* Progress percentage */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-2xl font-bold text-gradient tabular-nums">
            {Math.min(Math.round(progress), 100)}%
          </span>
          {phase !== "complete" && (
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          )}
        </div>


      </div>
    </div>
  );
}
