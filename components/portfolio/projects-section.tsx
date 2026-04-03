"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getProjects, type Project } from "@/lib/supabase/data";
import {
  ExternalLink,
  Github,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  Search,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";

// ── Project Detail Modal ──────────────────────────────────────────────────────

function ProjectModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const allImages = [
    ...(project.image_url ? [project.image_url] : []),
    ...(project.gallery_images ?? []),
  ];
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const prev = useCallback(
    () => setActiveImg((i) => (i - 1 + allImages.length) % allImages.length),
    [allImages.length]
  );
  const next = useCallback(
    () => setActiveImg((i) => (i + 1) % allImages.length),
    [allImages.length]
  );

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (lightbox) setLightbox(false); else onClose(); }
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, onClose, prev, next]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <>
      {/* ── Blurred backdrop ── */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* ── Modal: wide rectangular, side-by-side layout ── */}
        <div
          className="relative w-full max-w-5xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
          style={{ maxHeight: "min(86vh, 620px)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center hover:bg-background transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* ── LEFT: image pane (55% width) ── */}
          {allImages.length > 0 ? (
            <div className="relative md:w-[55%] shrink-0 flex flex-col bg-black/20 min-h-50">
              {/* Main image */}
              <div
                className="relative flex-1 overflow-hidden cursor-zoom-in group"
                onClick={() => setLightbox(true)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={activeImg}
                  src={allImages[activeImg]}
                  alt={`${project.title} screenshot ${activeImg + 1}`}
                  className="w-full h-full object-contain"
                />
                {/* Zoom overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/15">
                  <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
                    <ZoomIn className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Carousel arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); prev(); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 backdrop-blur text-white flex items-center justify-center hover:bg-black/65 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); next(); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 backdrop-blur text-white flex items-center justify-center hover:bg-black/65 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Counter pill */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/55 backdrop-blur text-white text-[11px] font-medium">
                    {activeImg + 1} / {allImages.length}
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {allImages.length > 1 && (
                <div className="flex gap-1.5 px-2.5 py-2 bg-background/70 backdrop-blur border-t border-border overflow-x-auto shrink-0">
                  {allImages.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={cn(
                        "shrink-0 w-11 h-8 rounded overflow-hidden border-2 transition-all duration-150",
                        i === activeImg
                          ? "border-primary"
                          : "border-transparent opacity-45 hover:opacity-90"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Placeholder when no images */
            <div className="md:w-[55%] shrink-0 bg-linear-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
              <span className="text-7xl font-bold text-primary/10 select-none">
                {project.title.charAt(0)}
              </span>
            </div>
          )}

          {/* ── RIGHT: info pane ── */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
              <div>
                {project.type && (
                  <Badge variant="outline" className="mb-2 border-primary/30 text-primary text-[11px]">
                    {project.type}
                  </Badge>
                )}
                <h2 className="text-lg md:text-xl font-bold leading-snug pr-8">
                  {project.title}
                </h2>
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                {project.long_description || project.description}
              </p>

              {project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 text-xs rounded-full bg-secondary text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Pinned footer with action buttons */}
            <div className="shrink-0 px-5 md:px-6 py-4 border-t border-border bg-card flex gap-2 flex-wrap">
              {project.live_url && (
                <Button size="sm" asChild className="gap-1.5 h-8 text-xs">
                  <a href={project.live_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Live Demo
                  </a>
                </Button>
              )}
              {project.github_url && (
                <Button size="sm" variant="outline" asChild className="gap-1.5 h-8 text-xs">
                  <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                    <Github className="w-3.5 h-3.5" />
                    GitHub
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Lightbox (full-screen) ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-200 bg-black/95 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightbox(false)}
          >
            <X className="w-5 h-5" />
          </button>
          {allImages.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                onClick={(e) => { e.stopPropagation(); prev(); }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                onClick={(e) => { e.stopPropagation(); next(); }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={allImages[activeImg]}
            alt={project.title}
            className="max-w-[90vw] max-h-[88vh] object-contain rounded-lg select-none"
            onClick={(e) => e.stopPropagation()}
          />
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs">
              {activeImg + 1} / {allImages.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ── View All Modal Project Card (compact 2-col) ────────────────────────────────

function ViewAllProjectCard({
  project,
  onClick,
}: {
  project: Project;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="group flex gap-5 p-5 rounded-xl bg-secondary/40 border border-border hover:border-primary/50 hover:bg-secondary/60 transition-all duration-200 cursor-pointer"
    >
      {/* Thumbnail — taller so it feels substantial */}
      {project.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.image_url}
          alt={project.title}
          className="w-28 h-20 object-cover rounded-lg border border-border shrink-0"
        />
      ) : (
        <div className="w-28 h-20 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-border">
          <span className="text-3xl font-bold text-primary/20">
            {project.title.charAt(0)}
          </span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          {project.type && (
            <Badge variant="outline" className="text-xs border-primary/30 text-primary shrink-0">
              {project.type}
            </Badge>
          )}
        </div>
        <h4 className="font-semibold text-base mb-1.5 leading-snug group-hover:text-primary transition-colors duration-200">
          {project.title}
        </h4>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {project.description}
        </p>
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {project.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="px-2 py-0.5 text-xs rounded-md bg-background/60 text-muted-foreground border border-border/60">
                {tag}
              </span>
            ))}
            {project.tags.length > 5 && (
              <span className="px-2 py-0.5 text-xs rounded-md bg-background/60 text-muted-foreground border border-border/60">
                +{project.tags.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Arrow hint */}
      <div className="shrink-0 flex items-center self-center">
        <ZoomIn className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
      </div>
    </div>
  );
}

// ── Projects Sort / Filter constants ─────────────────────────────────────────

const PROJECT_SORT_OPTIONS = [
  { value: "default", label: "Default Order" },
  { value: "title-asc", label: "Title A→Z" },
  { value: "title-desc", label: "Title Z→A" },
  { value: "featured-first", label: "Featured First" },
];

// ── ProjectFilterPanel ────────────────────────────────────────────────────────

function ProjectFilterPanel({
  types,
  activeType,
  onTypeChange,
  sortBy,
  onSortChange,
  onClose,
}: {
  types: string[];
  activeType: string;
  onTypeChange: (t: string) => void;
  sortBy: string;
  onSortChange: (s: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-xl bg-card border border-border shadow-xl shadow-black/10 p-4 space-y-4">
      {/* Project Type */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Project Type</p>
        <div className="flex flex-wrap gap-1.5">
          {["all", ...types].map((t) => (
            <button
              key={t}
              onClick={() => { onTypeChange(t); onClose(); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
                activeType === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
            >
              {t === "all" ? "All Types" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sort By</p>
        <div className="flex flex-col gap-1">
          {PROJECT_SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onSortChange(opt.value); onClose(); }}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                sortBy === opt.value
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Projects Section ──────────────────────────────────────────────────────────

export function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [openProject, setOpenProject] = useState<Project | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);

  // View-all modal filter state
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  // Collect unique project types for filter
  const projectTypes = useMemo(
    () => [...new Set(projects.map((p) => p.type).filter(Boolean) as string[])],
    [projects]
  );

  // Active filter count for badge
  const activeFilterCount = (activeType !== "all" ? 1 : 0) + (sortBy !== "default" ? 1 : 0);

  // Filtered + sorted list for the modal
  const filteredProjects = useMemo(() => {
    let list = [...projects];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.type?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (activeType !== "all") list = list.filter((p) => p.type === activeType);
    if (sortBy === "title-asc") list.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === "title-desc") list.sort((a, b) => b.title.localeCompare(a.title));
    else if (sortBy === "featured-first") list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return list;
  }, [projects, search, activeType, sortBy]);

  // Only show featured projects in the main grid
  const featuredProjects = projects.filter((p) => p.featured);

  return (
    <section id="projects" className="py-24 px-4 relative">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-primary font-mono text-sm mb-2">Browse My Recent</p>
          <h2 className="text-4xl md:text-5xl font-bold">Projects</h2>
        </div>

        {/* Featured Projects Grid */}
        {featuredProjects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProjects.map((project, index) => (
              <Card
                key={project.id}
                className={cn(
                  "group relative overflow-hidden bg-card/50 border-border hover:border-primary/50 transition-all duration-500 cursor-pointer",
                  index === 0 && "md:col-span-2 lg:col-span-2",
                  hoveredProject === project.id && "scale-[1.02] shadow-2xl shadow-primary/10"
                )}
                onMouseEnter={() => setHoveredProject(project.id)}
                onMouseLeave={() => setHoveredProject(null)}
                onClick={() => setOpenProject(project)}
              >
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Project Image */}
                {project.image_url && (
                  <div className="relative w-full h-48 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={project.image_url}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-b from-transparent to-card/60 group-hover:to-card/40 transition-all duration-500" />

                    {/* Gallery count badge */}
                    {(project.gallery_images?.length ?? 0) > 0 && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-black/50 backdrop-blur text-white text-xs font-medium">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {(project.gallery_images?.length ?? 0) + 1}
                      </div>
                    )}
                  </div>
                )}

                <CardContent className="relative p-6 md:p-8">
                  <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                    {project.type}
                  </Badge>

                  <h3 className="text-xl md:text-2xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                    {project.title}
                  </h3>

                  <p className="text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 text-xs rounded-full bg-secondary text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-3 items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                      onClick={(e) => { e.stopPropagation(); setOpenProject(project); }}
                    >
                      View Details
                    </Button>
                    {project.live_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a href={project.live_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    {project.github_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                          <Github className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>

                  <div className="absolute top-4 right-4 text-8xl font-bold text-primary/5 group-hover:text-primary/10 transition-colors duration-500 pointer-events-none">
                    0{index + 1}
                  </div>
                </CardContent>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-accent to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </Card>
            ))}

            {/* Coming Soon Card — only show if there's room */}
            <Card className="relative overflow-hidden bg-card/30 border-dashed border-border hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-6 md:p-8 flex flex-col items-center justify-center min-h-62.5">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-muted-foreground">More Coming Soon</h3>
                <p className="text-sm text-muted-foreground/70 text-center">Stay tuned for more exciting projects</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Fallback: no featured projects yet */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-muted-foreground font-semibold mb-1">No featured projects yet</p>
            <p className="text-sm text-muted-foreground/60">Mark projects as featured in the admin dashboard to display them here.</p>
          </div>
        )}

        {/* View All button — only show if there are non-featured projects too */}
        {projects.length > 0 && (
          <div className="text-center mt-10">
            <Button
              size="lg"
              variant="outline"
              className="px-6 py-5 text-base rounded-xl border-border text-foreground hover:border-primary hover:bg-primary/10 hover:text-cyan-500 transition-all duration-300"
              onClick={() => setShowAllModal(true)}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              View All {projects.length} Projects
            </Button>
          </div>
        )}
      </div>

      {/* ── View All Projects Modal ── */}
      <Dialog open={showAllModal} onOpenChange={setShowAllModal}>
        <DialogOverlay className="backdrop-blur-sm bg-black/50" />
        <DialogContent className="max-w-[95vw]! w-[95vw] sm:max-w-5xl! max-h-[88vh] overflow-hidden flex flex-col bg-card border-border p-0">
          {/* Header */}
          <DialogHeader className="flex flex-col gap-3 p-6 pb-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold">All Projects</DialogTitle>
              <p className="text-sm text-muted-foreground">
                {filteredProjects.length}
                {filteredProjects.length !== projects.length && ` of ${projects.length}`} projects
              </p>
            </div>

            {/* Search + Filter row */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, type, or tag…"
                  className="w-full h-9 pl-9 pr-4 rounded-lg bg-secondary/60 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/30 transition-colors"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Filter button */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterPanel((v) => !v)}
                  className={`h-9 px-3 rounded-lg border text-sm font-medium flex items-center gap-1.5 transition-all duration-150 ${
                    showFilterPanel || activeFilterCount > 0
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "bg-secondary/60 border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showFilterPanel ? "rotate-180" : ""}`} />
                </button>

                {showFilterPanel && (
                  <ProjectFilterPanel
                    types={projectTypes}
                    activeType={activeType}
                    onTypeChange={(t) => { setActiveType(t); }}
                    sortBy={sortBy}
                    onSortChange={(s) => { setSortBy(s); }}
                    onClose={() => setShowFilterPanel(false)}
                  />
                )}
              </div>
            </div>

            {/* Active filter chips */}
            {(activeType !== "all" || sortBy !== "default") && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {activeType !== "all" && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {activeType}
                    <button onClick={() => setActiveType("all")} className="hover:text-primary/70">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {sortBy !== "default" && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs font-medium">
                    {PROJECT_SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
                    <button onClick={() => setSortBy("default")} className="hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </DialogHeader>

          {/* Scrollable content — 2 columns */}
          <div className="overflow-y-auto p-6 pt-4 flex-1">
            {filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                  <Search className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <p className="font-semibold text-muted-foreground mb-1">No projects found</p>
                <p className="text-sm text-muted-foreground/60">Try adjusting your search or filters</p>
                <button
                  onClick={() => { setSearch(""); setActiveType("all"); setSortBy("default"); }}
                  className="mt-3 text-xs text-primary hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredProjects.map((project) => (
                  <ViewAllProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => {
                      setShowAllModal(false);
                      setTimeout(() => setOpenProject(project), 200);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Detail Modal */}
      {openProject && (
        <ProjectModal project={openProject} onClose={() => setOpenProject(null)} />
      )}
    </section>
  );
}