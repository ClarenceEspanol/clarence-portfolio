"use client";

import React, { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ScrollAnimator } from "./scroll-animator";
import { getSkills, type Skill } from "@/lib/supabase/data";
import { X, ChevronRight } from "lucide-react";

// ─── Distinct SVG Icon Map ────────────────────────────────────────────────────

const skillIcons: Record<string, { icon: ReactNode; color: string; bg: string }> = {
  html: {
    color: "#E34F26",
    bg: "#E34F2618",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <path d="M4 2l2.4 26.8L16 31l9.6-2.2L28 2H4z" fill="#E34F26"/>
        <path d="M16 28.4V4H26l-2 22.4L16 28.4z" fill="#EF652A"/>
        <path d="M10 8h6V12H10.8l.4 4H16v4H7.6L7 8h3z" fill="white"/>
        <path d="M22 8h-6v4h5.2l-.6 6.4L16 19.6V24l5.6-1.6L22.8 8H22z" fill="white"/>
      </svg>
    ),
  },
  css: {
    color: "#1572B6",
    bg: "#1572B618",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <path d="M4 2l2.4 26.8L16 31l9.6-2.2L28 2H4z" fill="#1572B6"/>
        <path d="M16 28.4V4H26l-2 22.4L16 28.4z" fill="#33A9DC"/>
        <path d="M22.8 8H16v4h6.4l-.4 4H16v4h5.6l-.6 4.8L16 25.6V30l5.6-1.6 1.2-14H22.8z" fill="white"/>
        <path d="M10 8H7l.6 8H16v-4h-5.8l-.2-4zM16 18H9.8l.4 6.4L16 26v-4.4l-2.6-.8-.2-2.8H16v-1z" fill="white"/>
      </svg>
    ),
  },
  javascript: {
    color: "#F7DF1E",
    bg: "#F7DF1E18",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <rect width="32" height="32" rx="4" fill="#F7DF1E"/>
        <path d="M18.8 25.4c.6 1 1.4 1.8 2.8 1.8 1.2 0 2-.6 2-1.4 0-1-.8-1.4-2.2-2l-.8-.4c-2.2-.9-3.6-2.1-3.6-4.6 0-2.3 1.7-4 4.4-4 1.9 0 3.3.7 4.3 2.4l-2.4 1.5c-.5-.9-1.1-1.3-1.9-1.3-.9 0-1.5.6-1.5 1.3 0 .9.6 1.3 1.9 1.9l.8.3c2.6 1.1 4 2.3 4 4.9 0 2.8-2.2 4.2-5.1 4.2-2.9 0-4.7-1.4-5.6-3.2l2.9-1.4zM9.8 25.6c.4.8.8 1.4 1.7 1.4.9 0 1.4-.3 1.4-1.7V15h3.1v10.4c0 2.8-1.6 4-4 4-2.2 0-3.4-1.1-4.1-2.5l2.9-1.3z" fill="#323330"/>
      </svg>
    ),
  },
  typescript: {
    color: "#3178C6",
    bg: "#3178C618",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <rect width="32" height="32" rx="4" fill="#3178C6"/>
        <path d="M18.4 15.2H15v10.8h-3V15.2H8V12.4h10.4v2.8zM25.6 18.8c-.2-.4-.5-.6-.9-.8-.4-.2-.8-.3-1.3-.4-.3-.1-.6-.2-.8-.3-.2-.1-.4-.2-.5-.3-.1-.1-.2-.3-.2-.5 0-.2.1-.4.3-.5.2-.1.5-.2.9-.2.3 0 .6.1.9.2.3.1.5.3.7.6l2-1.3c-.4-.7-1-1.2-1.7-1.5-.7-.3-1.5-.5-2.3-.5-.7 0-1.3.1-1.8.4-.6.2-1 .6-1.4 1-.3.4-.5.9-.5 1.5 0 .6.1 1.1.4 1.5.2.4.6.7 1 1 .4.2.9.4 1.4.5.4.1.8.2 1.1.4.3.1.5.3.7.4.2.2.2.4.2.6 0 .2-.1.4-.3.6-.2.1-.5.2-.9.2-.5 0-.9-.1-1.2-.4-.3-.2-.6-.6-.8-1l-2.1 1.2c.3.8.9 1.4 1.6 1.8.7.4 1.6.6 2.5.6.8 0 1.5-.1 2.1-.4.6-.3 1-.6 1.3-1.1.3-.5.5-1 .5-1.6 0-.6-.1-1.1-.4-1.6z" fill="white"/>
      </svg>
    ),
  },
  react: {
    color: "#61DAFB",
    bg: "#61DAFB18",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <circle cx="16" cy="16" r="3" fill="#61DAFB"/>
        <ellipse cx="16" cy="16" rx="14" ry="5.5" stroke="#61DAFB" strokeWidth="1.5" fill="none"/>
        <ellipse cx="16" cy="16" rx="14" ry="5.5" stroke="#61DAFB" strokeWidth="1.5" fill="none" transform="rotate(60 16 16)"/>
        <ellipse cx="16" cy="16" rx="14" ry="5.5" stroke="#61DAFB" strokeWidth="1.5" fill="none" transform="rotate(120 16 16)"/>
      </svg>
    ),
  },
  nextjs: {
    color: "#888888",
    bg: "#88888818",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <circle cx="16" cy="16" r="14" fill="currentColor" className="text-foreground"/>
        <path d="M10 22V10l14 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 10h6v6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  tailwind: {
    color: "#06B6D4",
    bg: "#06B6D418",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <path d="M16 8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.9.2 1.6.9 2.4 1.7C17.8 14 19.4 16 22.4 16c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.9-.2-1.6-.9-2.4-1.7C20.6 10 19 8 16 8zM10 16c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.9.2 1.6.9 2.4 1.7C11.8 22 13.4 24 16.4 24c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.9-.2-1.6-.9-2.4-1.7C14.6 18 13 16 10 16z" fill="#06B6D4"/>
      </svg>
    ),
  },
  java: {
    color: "#ED8B00",
    bg: "#ED8B0018",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <path d="M12 22s-1.2.7.8 1c2.4.2 3.6.2 6.2-.2 0 0 .7.4 1.6.8-5.6 2.4-12.6-.1-8.6-1.6zM11.2 19.2s-1.4 1 .8 1.2c2.8.3 5 .3 8.8-.4 0 0 .5.5 1.2.8-7.8 2.3-16.6.2-10.8-1.6z" fill="#ED8B00"/>
        <path d="M18 14c1.6 1.8.2 3.4.2 3.4s3.8-2 2.2-4.4c-1.6-2.4-2.8-3.6 3.8-7.6 0 0-10.4 2.6-6.2 8.6z" fill="#ED8B00"/>
        <path d="M24.8 24.4s.8.7-.9 1.2c-3.4 1-14 1.4-17-.1-1.1-.5.9-1.1 1.6-1.2.6-.1 1-.1 1-.1-.8-.3-2.8 0-4.8.9-3.2 1.4 18.6 3 20.1-.7zM12.6 16.2s-3.8.9-1.4 1.2c1 .2 3 .2 4.8-.1 1.5-.2 3-.6 3-.6s-.5.2-1.6.4c-4.6 1.2-13.4.7-10.8-.6 2.2-1 6-1.3 6-1.3z" fill="#ED8B00"/>
        <path d="M21.6 21s2.8-1.4 1.4-3.8c-1-1.6-2-2.4-2-2.4s4.4 2.2.6 6.2zM16.4 8s-3.4 3.4 0 6.6c2.6 2.4.6 4.6.6 4.6s4.8-4.4-2-8c-2.4-2.2-2.4-4.6 1.4-3.2z" fill="#ED8B00"/>
      </svg>
    ),
  },
  python: {
    color: "#3776AB",
    bg: "#3776AB18",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <path d="M16 2C10 2 10.6 4.6 10.6 4.6V7.4h5.6v.8H8.6C8.6 8.2 6 8.6 6 13c0 4.4 2.4 4.2 2.4 4.2h1.4v-2.8s-.2-2.4 2.4-2.4h5.4s2.2.1 2.2-2.2V5.4C19.8 3 17.6 2 16 2zm-3 1.8c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1z" fill="#3776AB"/>
        <path d="M16 30c6 0 5.4-2.6 5.4-2.6v-2.8h-5.6v-.8h7.6C23.4 23.8 26 23.4 26 19c0-4.4-2.4-4.2-2.4-4.2h-1.4v2.8s.2 2.4-2.4 2.4h-5.4S12 19.9 12 22.2v5.4C12.2 29 14.4 30 16 30zm3-1.8c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z" fill="#FFD342"/>
      </svg>
    ),
  },
  cpp: {
    color: "#00599C",
    bg: "#00599C18",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <path d="M16 2L3 9v14l13 7 13-7V9L16 2z" fill="#00599C"/>
        <path d="M10 16a6 6 0 1 0 6-6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M18 13v6M15 16h6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M23 13v6M20 16h6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  csharp: {
    color: "#239120",
    bg: "#23912018",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <path d="M16 2L3 9v14l13 7 13-7V9L16 2z" fill="#239120"/>
        <path d="M11 16a5 5 0 1 0 5-5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M18 12v8M21 12v8M16 15h6M16 17h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  git: {
    color: "#F05032",
    bg: "#F0503218",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <path d="M29.5 14.5l-12-12a2.1 2.1 0 0 0-3 0l-2.7 2.7 3.4 3.4a2.5 2.5 0 0 1 3.2 3.2l3.3 3.3a2.5 2.5 0 1 1-1.5 1.4l-3-3v7.8a2.5 2.5 0 1 1-2 0V13.1a2.5 2.5 0 0 1-1.3-3.2L11.5 6.5l-9 9a2.1 2.1 0 0 0 0 3l12 12a2.1 2.1 0 0 0 3 0l12-12a2.1 2.1 0 0 0 0-3z" fill="#F05032"/>
      </svg>
    ),
  },
  docker: {
    color: "#2496ED",
    bg: "#2496ED18",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <path d="M4 14.5h4V18H4v-3.5zM9 14.5h4V18H9v-3.5zM14 14.5h4V18h-4v-3.5zM9 9.5h4v3.5H9V9.5zM14 9.5h4v3.5h-4V9.5z" fill="#2496ED"/>
        <path d="M28 14.5c-.6-1.5-2.6-2-4-1.5-.2-1.6-1.5-3-3.2-3-.2 0-.4 0-.5.1V10c0-2.2-1.8-4-4-4a4 4 0 0 0-4 4H4C4 22 10 26 16 26s12-4 12-11.5h.1a3.5 3.5 0 0 0-.1 0z" fill="#2496ED"/>
      </svg>
    ),
  },
  sql: {
    color: "#336791",
    bg: "#33679118",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <ellipse cx="16" cy="9" rx="10" ry="4" fill="#336791"/>
        <path d="M6 9v5c0 2.2 4.5 4 10 4s10-1.8 10-4V9" stroke="#336791" strokeWidth="2" fill="none"/>
        <path d="M6 14v5c0 2.2 4.5 4 10 4s10-1.8 10-4v-5" stroke="#336791" strokeWidth="2" fill="none"/>
        <path d="M6 19v4c0 2.2 4.5 4 10 4s10-1.8 10-4v-4" stroke="#336791" strokeWidth="2" fill="none"/>
      </svg>
    ),
  },
  php: {
    color: "#777BB4",
    bg: "#777BB418",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <ellipse cx="16" cy="16" rx="14" ry="8" fill="#777BB4"/>
        <text x="9" y="20" fontFamily="monospace" fontSize="9" fontWeight="bold" fill="white">PHP</text>
      </svg>
    ),
  },
  wordpress: {
    color: "#21759B",
    bg: "#21759B18",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <circle cx="16" cy="16" r="14" fill="#21759B"/>
        <path d="M4 16C4 9.4 9.4 4 16 4c3.2 0 6.1 1.2 8.3 3.2L7 20.6A11.8 11.8 0 0 1 4 16z" fill="white" opacity="0.3"/>
        <path d="M16 28c-6.6 0-12-5.4-12-12 0-1.8.4-3.5 1.1-5l10.7 29.3A12 12 0 0 1 16 28z" fill="white" opacity="0.4"/>
        <text x="9.5" y="20" fontFamily="serif" fontSize="11" fontWeight="bold" fill="white">W</text>
      </svg>
    ),
  },
  vbnet: {
    color: "#5C2D91",
    bg: "#5C2D9118",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <rect width="32" height="32" rx="4" fill="#5C2D91"/>
        <text x="4" y="22" fontFamily="monospace" fontSize="9" fontWeight="bold" fill="white">VB</text>
        <text x="4" y="30" fontFamily="monospace" fontSize="7" fill="#B39DDB">.NET</text>
      </svg>
    ),
  },
  database: {
    color: "#FF6B35",
    bg: "#FF6B3518",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <ellipse cx="16" cy="8" rx="9" ry="3.5" fill="#FF6B35"/>
        <path d="M7 8v6c0 1.9 4 3.5 9 3.5s9-1.6 9-3.5V8" stroke="#FF6B35" strokeWidth="1.5" fill="none"/>
        <path d="M7 14v6c0 1.9 4 3.5 9 3.5s9-1.6 9-3.5v-6" stroke="#FF6B35" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
  },
  design: {
    color: "#FF4088",
    bg: "#FF408818",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <circle cx="11" cy="11" r="5" fill="#FF4088"/>
        <circle cx="21" cy="11" r="5" fill="#A259FF" opacity="0.8"/>
        <circle cx="16" cy="21" r="5" fill="#0ACF83" opacity="0.8"/>
      </svg>
    ),
  },
  prototype: {
    color: "#A259FF",
    bg: "#A259FF18",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <rect x="4" y="4" width="10" height="10" rx="2" fill="#A259FF"/>
        <rect x="18" y="4" width="10" height="10" rx="2" fill="#A259FF" opacity="0.5"/>
        <rect x="4" y="18" width="10" height="10" rx="2" fill="#A259FF" opacity="0.5"/>
        <rect x="18" y="18" width="10" height="10" rx="2" fill="#A259FF" opacity="0.3"/>
        <path d="M14 9h4M9 14v4M23 14v4M14 23h4" stroke="#A259FF" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  docs: {
    color: "#4A90D9",
    bg: "#4A90D918",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <rect x="6" y="2" width="20" height="28" rx="2" fill="#4A90D9" opacity="0.2" stroke="#4A90D9" strokeWidth="1.5"/>
        <path d="M10 10h12M10 15h12M10 20h8" stroke="#4A90D9" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  figma: {
    color: "#F24E1E",
    bg: "#F24E1E18",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <rect x="9" y="2" width="7" height="7" rx="3.5" fill="#F24E1E"/>
        <rect x="16" y="2" width="7" height="7" rx="3.5" fill="#FF7262"/>
        <rect x="9" y="9" width="7" height="7" rx="0" fill="#A259FF"/>
        <rect x="9" y="16" width="7" height="7" rx="0" fill="#1ABCFE"/>
        <rect x="9" y="23" width="7" height="7" rx="3.5" fill="#0ACF83"/>
        <circle cx="19.5" cy="12.5" r="3.5" fill="#FF7262"/>
      </svg>
    ),
  },
  vscode: {
    color: "#007ACC",
    bg: "#007ACC18",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <path d="M23 3L9 17l-6-5-3 3 9 9 17-14V6l-3-3z" fill="#007ACC"/>
        <path d="M23 29L9 15l-6 5-3-3 9-9 17 14v3l-3 3z" fill="#007ACC" opacity="0.7"/>
      </svg>
    ),
  },
  postman: {
    color: "#FF6C37",
    bg: "#FF6C3718",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <circle cx="16" cy="16" r="13" fill="#FF6C37"/>
        <path d="M16 9l5 5-5 5-5-5 5-5z" fill="white"/>
        <path d="M16 14v9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  linux: {
    color: "#FCC624",
    bg: "#FCC62418",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <path d="M16 2C10 2 7 8 7 14c0 3 1 5.5 2.5 7.5L8 26h16l-1.5-4.5C24 19.5 25 17 25 14c0-6-3-12-9-12z" fill="#FCC624"/>
        <circle cx="12.5" cy="13" r="1.5" fill="#333"/>
        <circle cx="19.5" cy="13" r="1.5" fill="#333"/>
        <path d="M13 18c1 1 5 1 6 0" stroke="#333" strokeWidth="1" strokeLinecap="round"/>
      </svg>
    ),
  },
  aws: {
    color: "#FF9900",
    bg: "#FF990018",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <path d="M9 18c-3 1-5 2.5-5 4s2 3 7 3 9-1.5 9-3-2-3-5-4" stroke="#FF9900" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M8 12l3-5 3 5H8zM18 12l3-5 3 5h-6z" fill="#FF9900"/>
        <path d="M11 12v6M21 12v6" stroke="#FF9900" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  firebase: {
    color: "#FFCA28",
    bg: "#FFCA2818",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <path d="M6 26L11 5l5 9 3-5 7 17H6z" fill="#FFCA28"/>
        <path d="M6 26l5-12 5 9-10 3z" fill="#FFA000" opacity="0.8"/>
        <path d="M19 9l7 17-10-3 3-14z" fill="#FF6F00" opacity="0.6"/>
      </svg>
    ),
  },
  vercel: {
    color: "#888888",
    bg: "#88888818",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <path d="M16 4L30 28H2L16 4z" fill="currentColor" className="text-foreground"/>
      </svg>
    ),
  },
  github: {
    color: "#888888",
    bg: "#88888818",
    icon: (
      <svg viewBox="0 0 32 32" fill="currentColor" className="w-5 h-5 text-foreground">
        <path d="M16 2C8.27 2 2 8.27 2 16c0 6.18 4.01 11.42 9.57 13.27.7.13.96-.3.96-.67v-2.35c-3.89.84-4.71-1.88-4.71-1.88-.64-1.62-1.56-2.05-1.56-2.05-1.27-.87.1-.85.1-.85 1.41.1 2.15 1.45 2.15 1.45 1.25 2.14 3.28 1.52 4.08 1.16.13-.9.49-1.52.89-1.87-3.1-.35-6.37-1.55-6.37-6.9 0-1.52.54-2.77 1.44-3.74-.14-.36-.63-1.77.14-3.69 0 0 1.17-.37 3.85 1.43A13.4 13.4 0 0 1 16 8.8c1.19.01 2.39.16 3.51.47 2.67-1.8 3.84-1.43 3.84-1.43.77 1.92.28 3.33.14 3.69.9.97 1.44 2.22 1.44 3.74 0 5.37-3.27 6.55-6.39 6.89.5.43.95 1.29.95 2.6v3.85c0 .37.25.8.96.67C25.99 27.42 30 22.18 30 16 30 8.27 23.73 2 16 2z"/>
      </svg>
    ),
  },
  default: {
    color: "#6B7280",
    bg: "#6B728018",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
        <path d="M8 10l4-4 4 4M16 6v14M8 22h16" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
};

function getSkillIcon(name: string, iconKey?: string) {
  const n = name.toLowerCase();
  const k = (iconKey || "").toLowerCase();

  if (k === "html" || n.includes("html")) return skillIcons.html;
  if (k === "css" || n.includes("css")) return skillIcons.css;
  if (k === "javascript" || (n.includes("javascript") && !n.includes("type"))) return skillIcons.javascript;
  if (k === "typescript" || n.includes("typescript")) return skillIcons.typescript;
  if (k === "react" || (n.includes("react") && !n.includes("native"))) return skillIcons.react;
  if (k === "nextjs" || n.includes("next")) return skillIcons.nextjs;
  if (k === "tailwind" || n.includes("tailwind")) return skillIcons.tailwind;
  if (k === "java" || (n.includes("java") && !n.includes("script"))) return skillIcons.java;
  if (k === "python" || n.includes("python")) return skillIcons.python;
  if (k === "cpp" || n.includes("c++") || n.includes("cpp")) return skillIcons.cpp;
  if (k === "csharp" || n.includes("c#")) return skillIcons.csharp;
  if (k === "php" || n.includes("php")) return skillIcons.php;
  if (k === "git" || n.includes("git")) return skillIcons.git;
  if (k === "docker" || n.includes("docker")) return skillIcons.docker;
  if (k === "sql" || n.includes("sql") || n.includes("postgres")) return skillIcons.sql;
  if (k === "database" || n.includes("database") || n.includes("db")) return skillIcons.database;
  if (k === "wordpress" || n.includes("wordpress")) return skillIcons.wordpress;
  if (k === "vbnet" || n.includes("vb.net") || n.includes("visual basic")) return skillIcons.vbnet;
  if (k === "design" || n.includes("ui/ux") || n.includes("design")) return skillIcons.design;
  if (k === "prototype" || n.includes("prototype")) return skillIcons.prototype;
  if (k === "docs" || n.includes("document")) return skillIcons.docs;
  if (k === "figma" || n.includes("figma")) return skillIcons.figma;
  if (k === "vscode" || n.includes("vs code") || n.includes("vscode")) return skillIcons.vscode;
  if (k === "postman" || n.includes("postman")) return skillIcons.postman;
  if (k === "linux" || n.includes("linux")) return skillIcons.linux;
  if (k === "aws" || n.includes("aws") || n.includes("amazon")) return skillIcons.aws;
  if (k === "firebase" || n.includes("firebase")) return skillIcons.firebase;
  if (k === "vercel" || n.includes("vercel")) return skillIcons.vercel;
  if (k === "github" || n.includes("github")) return skillIcons.github;

  return skillIcons.default;
}

// ─── Proficiency Config ───────────────────────────────────────────────────────

const proficiencyConfig: Record<string, { label: string; className: string; dot: string }> = {
  expert: {
    label: "Expert",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  experienced: {
    label: "Experienced",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    dot: "bg-blue-500",
  },
  intermediate: {
    label: "Intermediate",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    dot: "bg-amber-500",
  },
  beginner: {
    label: "Beginner",
    className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    dot: "bg-purple-500",
  },
};

// ─── Modal ────────────────────────────────────────────────────────────────────

type ProficiencyFilter = "all" | "expert" | "experienced" | "intermediate" | "beginner";

function SkillsModal({
  skills,
  onClose,
  activeCategory,
}: {
  skills: Skill[];
  onClose: () => void;
  activeCategory: string;
}) {
  const [filter, setFilter] = useState<ProficiencyFilter>("all");

  const filtered = skills.filter((s) => {
    const catMatch = activeCategory === "all" || s.category === activeCategory;
    const profMatch = filter === "all" || s.proficiency_level === filter;
    return catMatch && profMatch;
  });

  const filters: { key: ProficiencyFilter; label: string }[] = [
    { key: "all", label: "All Levels" },
    { key: "expert", label: "Expert" },
    { key: "experienced", label: "Experienced" },
    { key: "intermediate", label: "Intermediate" },
    { key: "beginner", label: "Beginner" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 className="text-xl font-bold">All Skills</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} skill{filtered.length !== 1 ? "s" : ""} shown</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Nav */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-border overflow-x-auto">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                filter === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
              {key !== "all" && (
                <span className="ml-1.5 text-xs opacity-70">
                  ({skills.filter((s) => s.proficiency_level === key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Skills Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((skill) => {
              const icon = getSkillIcon(skill.name, skill.icon);
              const prof = skill.proficiency_level ? proficiencyConfig[skill.proficiency_level] : null;
              return (
                <div
                  key={skill.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: icon.bg }}
                  >
                    {icon.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{skill.name}</p>
                    {prof && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border mt-0.5",
                          prof.className
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", prof.dot)} />
                        {prof.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No skills found for this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Category Box ─────────────────────────────────────────────────────────────

function CategoryBox({
  title,
  description,
  skills,
  onViewMore,
}: {
  title: string;
  description: string;
  skills: Skill[];
  onViewMore: () => void;
}) {
  // Pick 3 preview skills with most proficiency
  const profOrder = { expert: 0, experienced: 1, intermediate: 2, beginner: 3 };
  const previewSkills = [...skills]
    .sort((a, b) => (profOrder[a.proficiency_level as keyof typeof profOrder] ?? 4) - (profOrder[b.proficiency_level as keyof typeof profOrder] ?? 4))
    .slice(0, 3);

  return (
    <div className="flex flex-col bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 group">
      <h3 className="text-base font-bold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-5">{description}</p>

      {/* 3 Mini Icons inline */}
      <div className="flex items-center gap-3 mb-5">
        {previewSkills.map((skill) => {
          const icon = getSkillIcon(skill.name, skill.icon);
          return (
            <div
              key={skill.id}
              className="flex flex-col items-center gap-1.5"
              title={skill.name}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: icon.bg }}
              >
                {icon.icon}
              </div>
              <span className="text-[9px] text-muted-foreground font-medium truncate max-w-9 text-center leading-tight">
                {skill.name.split(" ")[0]}
              </span>
            </div>
          );
        })}
        {skills.length > 3 && (
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
              <span className="text-xs font-semibold text-muted-foreground">+{skills.length - 3}</span>
            </div>
            <span className="text-[9px] text-muted-foreground">more</span>
          </div>
        )}
      </div>

      <div className="mt-auto">
        <div className="text-xs text-muted-foreground mb-3">{skills.length} skills total</div>
        <button
          onClick={onViewMore}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline group-hover:gap-2 transition-all"
        >
          View all <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export function SkillsSection() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState<string>("all");

  useEffect(() => {
    getSkills().then((all) => setSkills(all));
  }, []);

  const frontendSkills = skills.filter((s) => s.category === "frontend");
  const backendSkills = skills.filter((s) => s.category === "backend");
  const toolsSkills = skills.filter((s) => s.category === "tools");

  // 3 boxes strictly from DB categories
  const categories = [
    {
      key: "frontend",
      title: "Frontend",
      description: "UI & visual layer technologies",
      skills: frontendSkills,
    },
    {
      key: "backend",
      title: "Backend",
      description: "Server-side languages & tools",
      skills: backendSkills,
    },
    {
      key: "tools",
      title: "Tools & Others",
      description: "Dev tools, platforms & more",
      skills: toolsSkills,
    },
  ];

  const handleViewMore = (category: string) => {
    setModalCategory(category);
    setModalOpen(true);
  };

  return (
    <section id="skills" className="py-20 relative">
      <div className="max-w-5xl mx-auto px-4">
        <ScrollAnimator>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Skills & Technologies</h2>
            <p className="text-muted-foreground text-sm mt-2">
              {skills.length} skills — {frontendSkills.length} frontend, {backendSkills.length} backend, {toolsSkills.length} tools
            </p>
          </div>
        </ScrollAnimator>

        {/* 3 Boxes in 1 row */}
        <ScrollAnimator>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <CategoryBox
                key={cat.key}
                title={cat.title}
                description={cat.description}
                skills={cat.skills}
                onViewMore={() => handleViewMore(cat.key)}
              />
            ))}
          </div>
        </ScrollAnimator>
      </div>

      {/* Modal */}
      {modalOpen && (
        <SkillsModal
          skills={skills}
          onClose={() => setModalOpen(false)}
          activeCategory={modalCategory}
        />
      )}
    </section>
  );
}