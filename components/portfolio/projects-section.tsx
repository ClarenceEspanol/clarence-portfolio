"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getProjects, type Project } from "@/lib/supabase/data";
import { ExternalLink, Github, ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

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
            <div className="relative md:w-[55%] shrink-0 flex flex-col bg-black/20 min-h-[200px]">
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
            <div className="md:w-[55%] shrink-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
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
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center"
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

// ── Projects Section ──────────────────────────────────────────────────────────

export function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [openProject, setOpenProject] = useState<Project | null>(null);

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  return (
    <section id="projects" className="py-24 px-4 relative">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-primary font-mono text-sm mb-2">Browse My Recent</p>
          <h2 className="text-4xl md:text-5xl font-bold">Projects</h2>
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
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

          {/* Coming Soon Card */}
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
      </div>

      {/* Project Detail Modal */}
      {openProject && (
        <ProjectModal project={openProject} onClose={() => setOpenProject(null)} />
      )}
    </section>
  );
}