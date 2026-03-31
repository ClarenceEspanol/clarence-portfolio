"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "complete" | "exit">("loading");
  const [currentText, setCurrentText] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [iconsVisible, setIconsVisible] = useState(false);
  const [nameVisible, setNameVisible] = useState(false);
  const [spinnerVisible, setSpinnerVisible] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);

  const loadingTexts = [
    "Initializing portfolio...",
    "Loading experiences...",
    "Preparing projects...",
    "Almost ready...",
  ];

  useEffect(() => {
    // Staggered fade-in for all components
    const iconTimer     = setTimeout(() => setIconsVisible(true),    200);
    const spinnerTimer  = setTimeout(() => setSpinnerVisible(true),  500);
    const nameTimer     = setTimeout(() => setNameVisible(true),     800);
    const progressTimer = setTimeout(() => setProgressVisible(true), 1000);

    const textInterval = setInterval(() => {
      setCurrentText((prev) => (prev + 1) % loadingTexts.length);
    }, 800);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          clearInterval(textInterval);
          setPhase("complete");
          setShowWelcome(true);
          setTimeout(() => {
            setPhase("exit");
            setTimeout(onComplete, 900);
          }, 1200);
          return 100;
        }
        return prev + Math.random() * 12 + 3;
      });
    }, 120);

    return () => {
      clearInterval(interval);
      clearInterval(textInterval);
      clearTimeout(iconTimer);
      clearTimeout(spinnerTimer);
      clearTimeout(nameTimer);
      clearTimeout(progressTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-100 flex items-center justify-center bg-background overflow-hidden",
        phase === "exit" && "animate-loading-exit"
      )}
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
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
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-loading-orb-1" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-loading-orb-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-loading-orb-3" />
        <div className="absolute inset-0 animate-loading-scan">
          <div className="h-px w-full bg-linear-to-r from-transparent via-primary/50 to-transparent" />
        </div>
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center z-10 w-full max-w-sm px-6">

        {/* Top icons: </> profile and GitHub — staggered fade in */}
        <div
          className={cn(
            "flex items-center gap-5 mb-6 transition-all duration-700",
            iconsVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          )}
        >
          {/* Code icon </> */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-mono font-bold text-sm">
              &lt;/&gt;
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">Dev</span>
          </div>

          {/* Divider dot */}
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />

          {/* Profile icon */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">Profile</span>
          </div>

          {/* Divider dot */}
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />

          {/* GitHub icon */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">GitHub</span>
          </div>
        </div>

        {/* Logo spinner — fades in after icons */}
        <div
          className={cn(
            "relative mb-8 transition-all duration-700",
            spinnerVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
          )}
        >
          <div className="w-28 h-28 relative">
            <div className="absolute inset-0 rounded-full border-2 border-primary/10" />
            <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-primary animate-spin" style={{ animationDuration: "2s" }} />
            <div className="absolute inset-3 rounded-full border border-accent/20" />
            <div className="absolute inset-3 rounded-full border-b-2 border-l-2 border-accent animate-spin" style={{ animationDuration: "1.5s", animationDirection: "reverse" }} />
            <div className="absolute inset-6 rounded-full border border-primary/10" />
            <div className="absolute inset-6 rounded-full border-t-2 border-primary/60 animate-spin" style={{ animationDuration: "1s" }} />
            <div className="absolute inset-9 rounded-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center animate-loading-pulse">
              <span className="text-lg font-bold text-gradient">CE</span>
            </div>
          </div>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary/60"
              style={{
                top: "50%",
                left: "50%",
                transform: `rotate(${i * 45}deg) translateY(-56px)`,
                animation: `loading-particle 2s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-loading-glow" />
        </div>

        {/* Text area — name fades in separately */}
        <div className="text-center mb-8 min-h-20 flex flex-col items-center justify-center">
          {!showWelcome ? (
            <>
              <h2
                className={cn(
                  "text-3xl md:text-4xl font-bold text-gradient mb-3 transition-all duration-700",
                  nameVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                )}
              >
                Clarence Español
              </h2>
              <p
                className={cn(
                  "text-muted-foreground text-sm font-mono transition-all duration-500",
                  nameVisible ? "opacity-100" : "opacity-0"
                )}
              >
                {loadingTexts[currentText]}
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 animate-welcome-in">
              <span className="text-4xl mb-1">👋</span>
              {/* Welcome screen: replace "Welcome to my portfolio" with full name */}
              <h2 className="text-3xl md:text-4xl font-bold text-gradient leading-tight">
                Clarence Español
              </h2>
              <p className="text-primary font-mono text-sm tracking-wide">
                Full Stack Developer
              </p>
            </div>
          )}
        </div>

        {/* Progress bar — fades in last */}
        <div
          className={cn(
            "relative w-64 transition-all duration-700",
            progressVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
        >
          <div
            className="absolute -inset-1 bg-linear-to-r from-primary/20 via-accent/20 to-primary/20 rounded-full blur-md transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
          <div className="relative h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-primary via-accent to-primary rounded-full transition-all duration-200 ease-out animate-gradient"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="h-full w-10 bg-linear-to-r from-transparent via-white/20 to-transparent animate-loading-shimmer" />
            </div>
          </div>
        </div>

        {/* Progress percentage */}
        <div
          className={cn(
            "mt-4 flex items-center gap-2 transition-all duration-700",
            progressVisible ? "opacity-100" : "opacity-0"
          )}
        >
          <span className="text-2xl font-bold text-gradient tabular-nums">
            {Math.min(Math.round(progress), 100)}%
          </span>
          {phase === "loading" && (
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes welcome-in {
          0% { opacity: 0; transform: scale(0.8) translateY(10px); }
          60% { transform: scale(1.05) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-welcome-in {
          animation: welcome-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}