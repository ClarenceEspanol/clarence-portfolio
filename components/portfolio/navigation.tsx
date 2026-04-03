"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getProfile, type Profile } from "@/lib/supabase/data";
import { useTheme } from "next-themes";
import {
  Sun, Moon, Home, User, Zap, FolderKanban, Award, Mail, MessageSquare
} from "lucide-react";

const navItems = [
  { name: "Home",         href: "#home",         icon: Home },
  { name: "About",        href: "#about",         icon: User },
  { name: "Skills",       href: "#skills",        icon: Zap },
  { name: "Projects",     href: "#projects",      icon: FolderKanban },
  { name: "Certificates", href: "#certificates",  icon: Award },
  { name: "Contact",      href: "#contact",       icon: Mail },
  { name: "Feedback",     href: "#feedback",      icon: MessageSquare },
];

/** Smooth-scroll to a section and update the URL hash */
function scrollToSection(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  e.preventDefault();
  const id = href.replace("#", "");
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
    window.history.pushState(null, "", href);
  }
}

function ThemeToggleButton() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-secondary transition-all duration-300 text-muted-foreground hover:text-foreground"
      aria-label="Toggle theme"
    >
      <Sun
        className={cn(
          "h-4 w-4 transition-all duration-500 absolute",
          isDark ? "opacity-0 rotate-180 scale-0" : "opacity-100 rotate-0 scale-100"
        )}
      />
      <Moon
        className={cn(
          "h-4 w-4 transition-all duration-500 absolute",
          isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-180 scale-0"
        )}
      />
      <span className="invisible">T</span>
      {/* Tooltip */}
      <span className="absolute left-full ml-3 px-2 py-1 text-xs font-medium bg-popover text-popover-foreground border border-border rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 pointer-events-none z-50">
        {isDark ? "Light mode" : "Dark mode"}
      </span>
    </button>
  );
}

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

    const initialHash = window.location.hash;
    if (initialHash) {
      const id = initialHash.replace("#", "");
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }

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
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById("home");
              if (el) el.scrollIntoView({ behavior: "smooth" });
              window.history.pushState(null, "", window.location.pathname);
            }}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div
              className={cn(
                "transition-all duration-300 overflow-hidden",
                showProfileInNav ? "w-8 h-8 opacity-100" : "w-0 opacity-0"
              )}
            >
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

          {/* Desktop Navigation — icon only with hover tooltip */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.href.slice(1);
              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => scrollToSection(e, item.href)}
                  className={cn(
                    "group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                  aria-label={item.name}
                >
                  <Icon className="w-4 h-4" />

                  {/* Active indicator dot */}
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}

                  {/* Hover tooltip */}
                  <span className="absolute top-full mt-2 px-2 py-1 text-xs font-medium bg-popover text-popover-foreground border border-border rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 pointer-events-none z-50">
                    {item.name}
                  </span>
                </a>
              );
            })}

            <div className="ml-1 border-l border-border pl-1">
              <ThemeToggleButton />
            </div>
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggleButton />
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
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  scrollToSection(e, item.href);
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300",
                  activeSection === item.href.slice(1)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}