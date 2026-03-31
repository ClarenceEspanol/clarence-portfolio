"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getProfile, type Profile } from "@/lib/supabase/data";

const roles = [
  "Full Stack Developer",
  "UI/UX Designer",
  "Tech Enthusiast",
  "Problem Solver",
];

function TypewriterRole() {
  const [displayText, setDisplayText] = useState("");
  const [roleIndex, setRoleIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "pause" | "erasing">("typing");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const currentRole = roles[roleIndex];

    if (phase === "typing") {
      if (displayText.length < currentRole.length) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(currentRole.slice(0, displayText.length + 1));
        }, 80);
      } else {
        timeoutRef.current = setTimeout(() => setPhase("pause"), 1800);
      }
    } else if (phase === "pause") {
      timeoutRef.current = setTimeout(() => setPhase("erasing"), 400);
    } else if (phase === "erasing") {
      if (displayText.length > 0) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 40);
      } else {
        setRoleIndex((prev) => (prev + 1) % roles.length);
        setPhase("typing");
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [displayText, phase, roleIndex]);

  return (
    <div className="h-12 mb-8 flex items-center justify-center">
      <span className="mx-2 text-xl sm:text-2xl md:text-3xl font-medium text-muted-foreground min-w-[2ch]">
        {displayText}
        <span className="inline-block w-0.5 h-6 bg-primary ml-0.5 align-middle animate-pulse" />
      </span>
    </div>
  );
}

export function HeroSection() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    getProfile().then(setProfile);
  }, []);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const initials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("")
    : "CE";

  const resumeUrl = profile?.resume_url ?? "/resume.pdf";
  const cvUrl = profile?.cv_url ?? "/cv.pdf";

  const handlePrintPortfolio = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 150);
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px),
                              linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float"
          style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-float-delayed"
          style={{ transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)` }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/10 rounded-full blur-2xl animate-pulse-glow"
          style={{ transform: `translate(-50%, -50%) translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)` }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Profile Picture */}
        <div className="mb-8 flex justify-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-linear-to-r from-primary to-accent rounded-full blur opacity-50 group-hover:opacity-75 transition duration-500" />
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-background shadow-xl">
              {profile?.profile_picture_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.profile_picture_url}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center text-4xl md:text-5xl font-bold text-primary">
                  {initials}
                </div>
              )}
            </div>
            {/* Status indicator */}
            <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
          </div>
        </div>

        {/* Greeting */}
        <p className="text-muted-foreground text-lg mb-4 animate-fade-in">
          Hello, I&apos;m
        </p>

        {/* Name */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6">
          <span className="text-gradient">{profile?.name ?? "Clarence Espanol"}</span>
        </h1>

        {/* Typewriter Role */}
        <TypewriterRole />

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/20"
            asChild
          >
            <a href="#projects">View My Work</a>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="px-8 py-6 text-lg rounded-xl border-border hover:bg-secondary hover:border-primary/50 transition-all duration-300 hover:scale-105"
            asChild
          >
            <a href="#contact">Get in Touch</a>
          </Button>

          {/* Download Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="lg"
                className="px-6 py-6 text-lg rounded-xl transition-all duration-300 hover:scale-105"
              >
                <Download className="w-5 h-5 mr-2" />
                Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              <DropdownMenuItem asChild>
                <a href={resumeUrl} download className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  Resume (PDF)
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={cvUrl} download className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  CV (PDF)
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault();
                  handlePrintPortfolio();
                }}
                disabled={isPrinting}
              >
                <Globe className="w-4 h-4 mr-2" />
                {isPrinting ? "Opening print dialog…" : "Portfolio (Print / Save PDF)"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </section>
  );
}