"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface GalleryImage {
  id: string;
  url: string;
  caption: string | null;
  sort_order: number;
}

// ── Gallery Section ───────────────────────────────────────────────────────────
export function GallerySection() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const offsetRef = useRef(0);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("gallery_images")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) setImages(data);
        setLoading(false);
      });
  }, []);

  // Auto-scroll animation
  useEffect(() => {
    if (images.length === 0) return;
    const track = trackRef.current;
    if (!track) return;

    const speed = 1;
    const animate = () => {
      if (!pausedRef.current) {
        offsetRef.current += speed;
        const halfWidth = track.scrollWidth / 2;
        if (offsetRef.current >= halfWidth) offsetRef.current = 0;
        track.style.transform = `translateX(-${offsetRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [images]);

  if (loading || images.length === 0) return null;

  const doubled = [...images, ...images];

  return (
    <div className="mt-14 overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5 px-4 max-w-6xl mx-auto">
        <div className="p-2 rounded-lg bg-cyan-500/10">
          <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <p className="text-cyan-500 font-mono text-xs leading-none mb-0.5">Visual Diary</p>
          <h3 className="text-xl font-bold leading-none">Gallery</h3>
        </div>
      </div>

      {/* Fade edges + scrolling track */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-linear-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-linear-to-l from-background to-transparent z-10 pointer-events-none" />

        <div
          className="flex gap-3 w-max"
          ref={trackRef}
          onMouseEnter={() => { pausedRef.current = true; }}
          onMouseLeave={() => { pausedRef.current = false; }}
        >
          {doubled.map((img, i) => (
            <div
              key={`${img.id}-${i}`}
              className="group relative shrink-0 rounded-xl overflow-hidden border border-border/50 bg-black"
              style={{
                width: "auto",
                height: "9rem",
                minWidth: "7rem",
                maxWidth: "14rem",
                cursor: "default",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.caption ?? "Gallery image"}
                className="w-full h-full object-contain grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                loading="lazy"
                style={{ display: "block" }}
              />

              {/* Cyan overlay tint */}
              <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 transition-all duration-500" />

              {/* Cyan border glow */}
              <div className="absolute inset-0 rounded-xl ring-0 group-hover:ring-2 group-hover:ring-cyan-500/60 transition-all duration-500" />

              {/* Caption slide-up — only when caption exists */}
              {img.caption && (
                <div className="absolute bottom-0 left-0 right-0 px-2.5 py-2 bg-linear-to-t from-black/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-[10px] text-white font-medium line-clamp-3 leading-snug">
                    {img.caption}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}