"use client";

import { useEffect, useState } from "react";
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

export function HeroSection() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentRole, setCurrentRole] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    getProfile().then(setProfile);
  }, []);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setCurrentRole((prev) => (prev + 1) % roles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mounted]);

  const initials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("")
    : "CE";

  const resumeUrl = profile?.resume_url ?? "/resume.pdf";
  const cvUrl = profile?.cv_url ?? "/cv.pdf";

  /**
   * Auto-generate a PDF of the full portfolio page using the browser's
   * native print dialog (Ctrl/Cmd+P → Save as PDF).
   * The print stylesheet in globals.css / layout handles hiding the admin
   * bar and other non-print elements.
   */
  const handlePrintPortfolio = () => {
    setIsPrinting(true);
    // Small delay so the button state updates before the dialog freezes the UI
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

        {/* Animated Role */}
        <div className="h-12 mb-8 overflow-hidden">
          <div
            className="transition-transform duration-500 ease-out"
            style={{ transform: `translateY(-${currentRole * 48}px)` }}
          >
            {roles.map((role) => (
              <div
                key={role}
                className="h-12 flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-medium text-muted-foreground"
              >
                <span className="font-mono text-primary">&lt;</span>
                <span className="mx-2">{role}</span>
                <span className="font-mono text-primary">/&gt;</span>
              </div>
            ))}
          </div>
        </div>

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
              {/* Resume — from Supabase or /public fallback */}
              <DropdownMenuItem asChild>
                <a href={resumeUrl} download className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  Resume (PDF)
                </a>
              </DropdownMenuItem>

              {/* CV — from Supabase or /public fallback */}
              <DropdownMenuItem asChild>
                <a href={cvUrl} download className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  CV (PDF)
                </a>
              </DropdownMenuItem>

              {/* Portfolio — auto-generates a PDF of this full webpage via browser print */}
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={(e) => {
                  // Prevent the dropdown from closing before print fires
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

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <a href="#about" className="block p-2 text-muted-foreground hover:text-primary transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}