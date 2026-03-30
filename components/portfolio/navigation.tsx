"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { getProfile, type Profile } from "@/lib/supabase/data";

const navItems = [
  { name: "Home", href: "#home" },
  { name: "About", href: "#about" },
  { name: "Skills", href: "#skills" },
  { name: "Projects", href: "#projects" },
  { name: "Certificates", href: "#certificates" },
  { name: "Contact", href: "#contact" },
];

export function Navigation() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeSection, setActiveSection] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    getProfile().then(setProfile);
  }, []);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      const sections = navItems.map((item) => item.href.slice(1));
      for (const section of sections.reverse()) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const showProfileInNav = scrolled && activeSection !== "home";

  if (!mounted) return null;

  const initials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("")
    : "CE";
  const firstName = profile?.name ? profile.name.split(" ")[0] : "Clarence";

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "glass bg-background/80 border-b border-border shadow-lg"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a
            href="#home"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div
              className={cn(
                "transition-all duration-300 overflow-hidden",
                showProfileInNav ? "w-8 h-8 opacity-100" : "w-0 opacity-0"
              )}
            >
              {/* Show real profile picture if available, otherwise initials */}
              {profile?.profile_picture_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.profile_picture_url}
                  alt={profile.name ?? "Profile"}
                  className="w-8 h-8 rounded-full object-cover border-2 border-primary/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xs font-bold text-primary border-2 border-primary/20">
                  {initials}
                </div>
              )}
            </div>
            <span className="text-xl font-bold text-gradient">
              {showProfileInNav ? firstName : "CE"}
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                  activeSection === item.href.slice(1)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {item.name}
              </a>
            ))}
            <div className="ml-2 border-l border-border pl-2">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={cn("w-full h-0.5 bg-foreground transition-all duration-300", mobileMenuOpen && "rotate-45 translate-y-2")} />
                <span className={cn("w-full h-0.5 bg-foreground transition-all duration-300", mobileMenuOpen && "opacity-0")} />
                <span className={cn("w-full h-0.5 bg-foreground transition-all duration-300", mobileMenuOpen && "-rotate-45 -translate-y-2")} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden glass bg-background/95 border-b border-border overflow-hidden transition-all duration-300",
          mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300",
                activeSection === item.href.slice(1)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {item.name}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}