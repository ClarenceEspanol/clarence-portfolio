"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getProjects, type Project } from "@/lib/supabase/data";

export function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

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
                </div>
              )}

              <CardContent className="relative p-6 md:p-8">
                <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                  {project.type}
                </Badge>

                <h3 className="text-xl md:text-2xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                  {project.title}
                </h3>

                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 text-xs rounded-full bg-secondary text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex gap-3">
                  {project.live_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                      asChild
                    >
                      <a href={project.live_url} target="_blank" rel="noopener noreferrer">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Live Demo
                      </a>
                    </Button>
                  )}
                  {project.github_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                      asChild
                    >
                      <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                        GitHub
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
    </section>
  );
}