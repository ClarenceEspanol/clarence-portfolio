"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Presentation, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { getProfile, getSkills, getProjects, getCertificates, type Profile } from "@/lib/supabase/data";

// ─── Default fallback roles (used if DB is empty) ────────────────────────────
const DEFAULT_ROLES = [
  "Full Stack Developer",
  "UI/UX Designer",
  "Tech Enthusiast",
  "Problem Solver",
];

const AVAILABILITY_CONFIG = {
  available: {
    label: "Open to Work",
    dot: "bg-green-500",
    badge: "bg-green-500/15 text-green-600 border-green-500/30",
    ping: "bg-green-500",
  },
  freelance: {
    label: "Available for Freelance",
    dot: "bg-blue-500",
    badge: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    ping: "bg-blue-500",
  },
  employed: {
    label: "Currently Employed",
    dot: "bg-amber-500",
    badge: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    ping: "bg-amber-500",
  },
} as const;

function AvailabilityBadge({ status }: { status: Profile["availability_status"] }) {
  if (!status) return null;
  const cfg = AVAILABILITY_CONFIG[status];
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${cfg.badge} mb-6`}>
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cfg.ping}`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`} />
      </span>
      {cfg.label}
    </div>
  );
}

// ─── Typewriter — now accepts roles from DB ───────────────────────────────────
function TypewriterRole({ roles }: { roles: string[] }) {
  const [displayText, setDisplayText] = useState("");
  const [roleIndex, setRoleIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "pause" | "erasing">("typing");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset when roles change (e.g. loaded from DB)
  useEffect(() => {
    setDisplayText("");
    setRoleIndex(0);
    setPhase("typing");
  }, [roles]);

  useEffect(() => {
    if (roles.length === 0) return;
    const currentRole = roles[roleIndex % roles.length];
    if (phase === "typing") {
      if (displayText.length < currentRole.length) {
        timeoutRef.current = setTimeout(
          () => setDisplayText(currentRole.slice(0, displayText.length + 1)),
          80
        );
      } else {
        timeoutRef.current = setTimeout(() => setPhase("pause"), 1800);
      }
    } else if (phase === "pause") {
      timeoutRef.current = setTimeout(() => setPhase("erasing"), 400);
    } else if (phase === "erasing") {
      if (displayText.length > 0) {
        timeoutRef.current = setTimeout(() => setDisplayText(displayText.slice(0, -1)), 40);
      } else {
        setRoleIndex((prev) => (prev + 1) % roles.length);
        setPhase("typing");
      }
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [displayText, phase, roleIndex, roles]);

  return (
    <div className="h-12 mb-8 flex items-center justify-center">
      <span className="mx-2 text-xl sm:text-2xl md:text-3xl font-medium text-muted-foreground min-w-[2ch]">
        {displayText}
        <span className="inline-block w-0.5 h-6 bg-primary ml-0.5 align-middle animate-pulse" />
      </span>
    </div>
  );
}

// ─── PPTX Auto-Generator (DOM-based, no external API) ────────────────────────

interface PortfolioData {
  profile: Profile;
  skills: { name: string }[];
  projects: { title: string; description?: string | null; tech_stack?: string[] | null }[];
  certs: { title: string; issuer: string }[];
}

async function generatePortfolioPptx(data: PortfolioData): Promise<void> {
  const { profile, skills, projects, certs } = data;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Generating Portfolio…</title>
  <style>
    body { font-family: sans-serif; background: #0f172a; color: #e2e8f0;
           display: flex; flex-direction: column; align-items: center;
           justify-content: center; height: 100vh; margin: 0; gap: 16px; }
    .spinner { width: 40px; height: 40px; border: 3px solid #334155;
               border-top-color: #0ea5e9; border-radius: 50%;
               animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { color: #94a3b8; font-size: 14px; }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <p>Generating your portfolio PPTX…</p>
  <script src="https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js"></script>
  <script>
    (function() {
      const BG   = "0f172a";
      const ACC  = "0ea5e9";
      const WHITE = "e2e8f0";
      const DIM   = "64748b";

      const profile  = ${JSON.stringify({ 
        name: profile.name ?? "Clarence Espanol",
        title: profile.title ?? "Full Stack Developer",
        email: profile.email ?? "",
        location: profile.location ?? "Philippines",
        bio: profile.bio ?? "",
        experience: profile.experience ?? "",
        education: profile.education ?? "",
        github_url: (profile as any).github_url ?? "",
        linkedin_url: (profile as any).linkedin_url ?? "",
      })};
      const skills   = ${JSON.stringify(skills.slice(0, 18).map(s => s.name))};
      const projects = ${JSON.stringify(projects.slice(0, 6).map(p => ({ title: p.title, desc: p.description ?? "", tech: (p.tech_stack ?? []).join(", ") })))};
      const certs    = ${JSON.stringify(certs.slice(0, 8).map(c => ({ title: c.title, issuer: c.issuer })))};

      const pptx = new PptxGenJS();
      pptx.layout  = "LAYOUT_WIDE";
      pptx.author  = profile.name;
      pptx.subject = "Portfolio";
      pptx.title   = profile.name + " — Portfolio";

      function bg(slide) { slide.background = { color: BG }; }
      function accent(slide, y) {
        slide.addShape(pptx.ShapeType.rect, { x: 0, y: y, w: 13.33, h: 0.04, fill: { color: ACC } });
      }
      function heading(slide, text, y) {
        slide.addText(text, { x: 0.5, y, w: 12.33, h: 0.6, fontSize: 24, bold: true, color: ACC, fontFace: "Calibri" });
        accent(slide, y + 0.65);
      }

      // ── Slide 1: Title ──
      const s1 = pptx.addSlide();
      bg(s1);
      s1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: "0a1628" } });
      s1.addShape(pptx.ShapeType.rect, { x: 0, y: 3.5, w: 13.33, h: 0.06, fill: { color: ACC } });
      s1.addText(profile.name, { x: 0.8, y: 1.5, w: 11.73, h: 1.2, fontSize: 48, bold: true, color: WHITE, fontFace: "Calibri", align: "center" });
      s1.addText(profile.title, { x: 0.8, y: 2.9, w: 11.73, h: 0.6, fontSize: 22, color: ACC, fontFace: "Calibri", align: "center" });
      s1.addText([
        profile.email ? { text: "✉  " + profile.email + "   ", options: { color: "94a3b8" } } : null,
        profile.location ? { text: "📍 " + profile.location, options: { color: "94a3b8" } } : null,
      ].filter(Boolean), { x: 0.8, y: 3.8, w: 11.73, h: 0.5, fontSize: 13, fontFace: "Calibri", align: "center" });
      s1.addText("Portfolio Presentation", { x: 0.8, y: 6.7, w: 11.73, h: 0.4, fontSize: 11, color: DIM, fontFace: "Calibri", align: "center" });

      pptx.writeFile({ fileName: profile.name.replace(/\\s+/g, "_") + "_Portfolio.pptx" })
        .then(() => window.close())
        .catch(console.error);
    })();
  <\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) alert("Please allow pop-ups to generate the PPTX.");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HERO SECTION
// ═══════════════════════════════════════════════════════════════════════════════

export function HeroSection() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>(DEFAULT_ROLES);
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0, active: false });
  const [isGeneratingPptx, setIsGeneratingPptx] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Fetch profile
  useEffect(() => { getProfile().then(setProfile); }, []);

  // Fetch typing roles from DB
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("hero_roles")
      .select("label")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setRoles(data.map((r: { label: string }) => r.label));
        }
      });
  }, []);

  useEffect(() => {
    setMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: (e.clientX / window.innerWidth - 0.5) * 20, y: (e.clientY / window.innerHeight - 0.5) * 20 });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleAvatarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = avatarRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * 18, y: -dx * 18, active: true });
  };

  const handleAvatarMouseLeave = () => setTilt({ x: 0, y: 0, active: false });

  const initials = profile?.name ? profile.name.split(" ").map((n) => n[0]).join("") : "CE";

  const resumeUrl = profile?.resume_url ?? "/resume.pdf";
  const cvUrl = profile?.cv_url ?? "/cv.pdf";

  const handleDownloadPortfolioPptx = async () => {
    if (!profile || isGeneratingPptx) return;
    setIsGeneratingPptx(true);
    try {
      const [skills, projects, certs] = await Promise.all([
        getSkills(),
        getProjects(),
        getCertificates(),
      ]);
      await generatePortfolioPptx({ profile, skills, projects, certs });
    } catch (err) {
      console.error("PPTX generation error:", err);
    } finally {
      setIsGeneratingPptx(false);
    }
  };

  if (!mounted) return null;

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float"
          style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-float-delayed"
          style={{ transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)` }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary/10 rounded-full blur-2xl animate-pulse-glow"
          style={{ transform: `translate(-50%, -50%) translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)` }} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Profile Picture */}
        <div className="mb-8 flex justify-center">
          <div ref={avatarRef} onMouseMove={handleAvatarMouseMove} onMouseLeave={handleAvatarMouseLeave}
            className="relative cursor-pointer" style={{ perspective: "600px" }}>
            <div style={{
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilt.active ? 0.96 : 1})`,
              transition: tilt.active ? "transform 0.08s ease-out" : "transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
              transformStyle: "preserve-3d",
            }}>
              <div className="absolute -inset-1 rounded-full blur-md"
                style={{
                  background: "linear-gradient(to bottom right, var(--primary), var(--accent, #818cf8))",
                  opacity: tilt.active ? 0.75 : 0.45,
                  transform: `translateX(${tilt.y * 0.5}px) translateY(${tilt.x * 0.5}px)`,
                  transition: "opacity 0.2s, transform 0.08s ease-out",
                }} />
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-background shadow-2xl">
                {profile?.profile_picture_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.profile_picture_url} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-4xl md:text-5xl font-bold text-primary">
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at ${50 + tilt.y * 2}% ${50 + tilt.x * 2}%, rgba(255,255,255,0.18) 0%, transparent 65%)`,
                    opacity: tilt.active ? 1 : 0,
                    transition: "opacity 0.2s",
                  }} />
              </div>
              <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
            </div>
          </div>
        </div>

        <p className="text-muted-foreground text-lg mb-4 animate-fade-in">Hello, I&apos;m</p>
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6">
          <span className="text-gradient">{profile?.name ?? "Clarence Espanol"}</span>
        </h1>

        {/* Typewriter — powered by DB roles */}
        <TypewriterRole roles={roles} />

        <div className="flex justify-center">
          <AvailabilityBadge status={profile?.availability_status ?? null} />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/20"
            asChild>
            <a href="#projects" onClick={(e) => { e.preventDefault(); document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" }); }}>
              View My Work
            </a>
          </Button>

          <Button variant="outline" size="lg"
            className="px-8 py-6 text-lg rounded-xl border-border text-foreground hover:bg-secondary hover:text-primary hover:border-primary/50 transition-all duration-300 hover:scale-105"
            asChild>
            <a href="#contact" onClick={(e) => { e.preventDefault(); document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }); }}>
              Get in Touch
            </a>
          </Button>

          {/* Download Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="lg" className="px-6 py-6 text-lg rounded-xl transition-all duration-300 hover:scale-105">
                <Download className="w-5 h-5 mr-2" />Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-60">
              <DropdownMenuItem asChild>
                <a href={resumeUrl} download className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />Resume (PDF)
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={cvUrl} download className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />CV (PDF)
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                disabled={isGeneratingPptx}
                onSelect={(e) => {
                  e.preventDefault();
                  handleDownloadPortfolioPptx();
                }}
              >
                {isGeneratingPptx ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating PPTX…</>
                ) : (
                  <><Presentation className="w-4 h-4 mr-2" />Portfolio (Auto-Generate PPTX)</>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </section>
  );
}