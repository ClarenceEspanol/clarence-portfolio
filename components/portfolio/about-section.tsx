"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getProfile, getWorkExperience, type Profile, type WorkExperience } from "@/lib/supabase/data";
import { ScrollAnimator } from "./scroll-animator";
import { Briefcase } from "lucide-react";

const stats = [
  { label: "Projects Completed", value: 5, suffix: "+" },
  { label: "Certificates Earned", value: 16, suffix: "" },
  { label: "Years Learning", value: 3, suffix: "+" },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const end = value;
          const duration = 2000;
          const stepTime = duration / end;
          const timer = setInterval(() => {
            start += 1;
            setCount(start);
            if (start >= end) clearInterval(timer);
          }, stepTime);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, hasAnimated]);

  return (
    <div ref={ref} className="text-4xl md:text-5xl font-bold text-gradient">
      {count}{suffix}
    </div>
  );
}

export function AboutSection() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);

  useEffect(() => {
    getProfile().then(setProfile);
    getWorkExperience().then(setWorkExperience);
  }, []);

  return (
    <section id="about" className="py-24 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <ScrollAnimator className="text-center mb-16">
          <p className="text-primary font-mono text-sm mb-2">Get To Know More</p>
          <h2 className="text-4xl md:text-5xl font-bold">About Me</h2>
        </ScrollAnimator>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left - Info Cards */}
          <div className="space-y-6">
            <Card className="bg-card/50 border-border hover:border-primary/50 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Experience</h3>
                    <p className="text-muted-foreground text-sm">{profile?.experience ?? "Loading..."}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border hover:border-primary/50 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Education</h3>
                    <p className="text-muted-foreground text-sm">{profile?.education ?? "Loading..."}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border hover:border-primary/50 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Location</h3>
                    <p className="text-muted-foreground text-sm">
                      {profile?.location ? `${profile.location}, Philippines` : "Loading..."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right - Bio & Stats */}
          <div className="space-y-8">
            <p className="text-muted-foreground leading-relaxed text-lg">{profile?.bio ?? "Loading..."}</p>
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="text-center p-4 rounded-xl bg-card/50 border border-border hover:border-primary/50 transition-all duration-300"
                >
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  <p className="text-muted-foreground text-sm mt-2">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Work Experience — compact horizontal scroll ── */}
        {workExperience.length > 0 && (
          <ScrollAnimator delay={100} className="mt-14">
            {/* Header row */}
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-primary/10">
                <Briefcase className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-primary font-mono text-xs leading-none mb-0.5">Career Path</p>
                <h3 className="text-xl font-bold leading-none">Work Experience</h3>
              </div>
            </div>

            {/* Scrollable cards row */}
            <div className="relative">
              {/* Fade edges so cards slide smoothly under them */}
              <div className="absolute left-0 top-0 bottom-3 w-6 bg-linear-to-r from-background to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-3 w-6 bg-linear-to-l from-background to-transparent z-10 pointer-events-none" />

              <div
                className="flex gap-3 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {workExperience.map((exp, index) => (
                  <div key={exp.id} className="snap-start shrink-0 w-60 group">
                    <div className="relative h-full p-4 rounded-xl bg-card/50 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
                      {/* Large ghost number */}
                      <span className="absolute top-3 right-3 text-4xl font-bold text-primary/5 group-hover:text-primary/10 transition-colors duration-300 pointer-events-none select-none leading-none">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      {/* Period chip */}
                      {exp.period && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-mono mb-2.5">
                          {exp.period}
                        </span>
                      )}

                      <h4 className="font-semibold text-sm leading-snug mb-1 group-hover:text-primary transition-colors duration-300 pr-6">
                        {exp.title}
                      </h4>

                      {exp.role && (
                        <p className="text-[11px] text-primary/70 font-medium mb-1.5">{exp.role}</p>
                      )}

                      {exp.description && (
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                          {exp.description}
                        </p>
                      )}

                      {/* Bottom accent */}
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-primary/60 to-accent/60 rounded-b-xl scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Dot row */}
              {workExperience.length > 1 && (
                <div className="flex justify-center gap-1 mt-2">
                  {workExperience.map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-border" />
                  ))}
                </div>
              )}
            </div>
          </ScrollAnimator>
        )}
      </div>
    </section>
  );
}