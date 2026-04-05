"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ExternalLink, Music2, Pause, Play, Clock, TrendingUp, History, Loader2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Track {
  title: string;
  artist: string;
  album: string;
  albumArt: string | null;
  songUrl: string;
  duration: number;
  playedAt?: string;
}

interface NowPlaying extends Track {
  isPlaying: boolean;
  progress: number;
}

interface SpotifyData {
  nowPlaying: NowPlaying | null;
  topTracks: Track[];
  recentTracks: Track[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMs(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Equalizer bars (animated when playing) ────────────────────────────────────

function EqBars({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-end gap-0.5 h-4 shrink-0">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-0.75 rounded-full bg-[#1DB954]"
          style={{
            height: playing ? undefined : "4px",
            animation: playing ? `eq-bar ${0.6 + i * 0.15}s ease-in-out infinite alternate` : "none",
          }}
        />
      ))}
    </div>
  );
}

// ── Progress bar for now playing ─────────────────────────────────────────────

function ProgressBar({ progress, duration, isPlaying }: { progress: number; duration: number; isPlaying: boolean }) {
  const [current, setCurrent] = useState(progress);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setCurrent(progress);
    if (ref.current) clearInterval(ref.current);
    if (isPlaying) {
      ref.current = setInterval(() => {
        setCurrent((p) => Math.min(p + 1000, duration));
      }, 1000);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [progress, isPlaying, duration]);

  const pct = Math.min((current / duration) * 100, 100);

  return (
    <div className="space-y-1">
      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-[#1DB954] transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-white/40 font-mono">
        <span>{fmtMs(current)}</span>
        <span>{fmtMs(duration)}</span>
      </div>
    </div>
  );
}

// ── Album Art ─────────────────────────────────────────────────────────────────

function AlbumArt({ src, alt, size = 48 }: { src: string | null; alt: string; size?: number }) {
  if (!src) {
    return (
      <div
        className="rounded-md bg-white/5 flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <Music2 className="w-4 h-4 text-white/20" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="rounded-md object-cover shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

// ── Track Row ─────────────────────────────────────────────────────────────────

function TrackRow({ track, index, showIndex = false, meta }: {
  track: Track;
  index: number;
  showIndex?: boolean;
  meta?: string;
}) {
  return (
    <a
      href={track.songUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
    >
      {showIndex && (
        <span className="w-5 text-center text-xs text-white/30 font-mono shrink-0 group-hover:hidden">
          {index + 1}
        </span>
      )}
      {showIndex && (
        <Play className="w-3 h-3 text-[#1DB954] shrink-0 hidden group-hover:block" />
      )}
      <AlbumArt src={track.albumArt} alt={track.album} size={40} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate group-hover:text-[#1DB954] transition-colors">
          {track.title}
        </p>
        <p className="text-xs text-white/50 truncate">{track.artist}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {meta && <span className="text-[10px] text-white/30">{meta}</span>}
        <span className="text-[10px] text-white/30 font-mono">{fmtMs(track.duration)}</span>
        <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-[#1DB954] transition-colors" />
      </div>
    </a>
  );
}

// ── Now Playing Card ──────────────────────────────────────────────────────────

function NowPlayingCard({ track }: { track: NowPlaying }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-linear-to-br from-[#1DB954]/10 via-white/3 to-transparent p-5">
      {/* Blurred bg art */}
      {track.albumArt && (
        <div className="absolute inset-0 opacity-10 blur-2xl scale-110 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={track.albumArt} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="relative flex gap-4">
        <div className="relative shrink-0">
          <AlbumArt src={track.albumArt} alt={track.album} size={80} />
          <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#1DB954] flex items-center justify-center shadow-lg">
            {track.isPlaying
              ? <Pause className="w-3 h-3 text-black fill-black" />
              : <Play className="w-3 h-3 text-black fill-black" />}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <EqBars playing={track.isPlaying} />
            <span className="text-[10px] text-[#1DB954] font-semibold uppercase tracking-wider">
              {track.isPlaying ? "Now Playing" : "Paused"}
            </span>
          </div>
          <a
            href={track.songUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-base font-bold text-white hover:text-[#1DB954] transition-colors truncate leading-tight"
          >
            {track.title}
          </a>
          <p className="text-sm text-white/60 truncate">{track.artist}</p>
          <p className="text-xs text-white/30 truncate">{track.album}</p>
        </div>
      </div>

      <div className="relative mt-4">
        <ProgressBar
          progress={track.progress}
          duration={track.duration}
          isPlaying={track.isPlaying}
        />
      </div>
    </div>
  );
}

// ── Offline Card ──────────────────────────────────────────────────────────────

function OfflineCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/3 p-5 flex items-center gap-4">
      <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
        <Music2 className="w-6 h-6 text-white/20" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white/60">Not listening right now</p>
        <p className="text-xs text-white/30 mt-0.5">Check back later for live updates</p>
      </div>
    </div>
  );
}

// ── Tab Button ────────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
        active
          ? "bg-[#1DB954]/15 text-[#1DB954]"
          : "text-white/40 hover:text-white/70 hover:bg-white/5"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Main Spotify Modal ────────────────────────────────────────────────────────

interface SpotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SpotifyModal({ isOpen, onClose }: SpotifyModalProps) {
  const [data, setData] = useState<SpotifyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"top" | "recent">("top");

  // ── Initial full load (nowPlaying + topTracks + recentTracks) ───────────────
  // Only fires once when the modal opens. Top tracks and recently played are
  // kept in state — they don't need to re-fetch on every poll cycle.
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    fetch("/api/spotify/now-playing")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Couldn't load Spotify data"); setLoading(false); });
  }, [isOpen]);

  // ── Polling — now-playing only, every 60s ────────────────────────────────────
  // Was: fetching ALL data (nowPlaying + topTracks + recentTracks) every 30s.
  // Now: only nowPlaying updates on each poll — topTracks/recentTracks are
  // already in state from the initial load and don't need live refreshing.
  // This halves the effective payload size and doubles the interval,
  // cutting poll-driven serverless invocations by ~4x while the modal is open.
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      fetch("/api/spotify/now-playing")
        .then((r) => r.json())
        .then((d) => {
          // Merge: only update nowPlaying — preserve cached topTracks/recentTracks
          setData((prev) => prev ? { ...prev, nowPlaying: d.nowPlaying } : d);
        })
        .catch(() => {});
    }, 60_000); // 60s — was 30s
    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <>
      <style>{`
        @keyframes eq-bar {
          from { height: 4px; }
          to { height: 16px; }
        }
      `}</style>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogOverlay className="backdrop-blur-sm bg-black/60" />
        <DialogContent className="max-w-[95vw]! w-[95vw] sm:max-w-lg! max-h-[88vh] overflow-hidden flex flex-col p-0 border-0 bg-transparent shadow-none [&>button]:hidden">
          <VisuallyHidden>
            <DialogTitle>Clarence&apos;s Spotify Activity</DialogTitle>
          </VisuallyHidden>

          {/* Modal shell */}
          <div className="relative flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d0d] shadow-2xl max-h-[88vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] shrink-0">
              <div className="flex items-center gap-3">
                {/* Spotify logo */}
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#1DB954]">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                <div>
                  <h2 className="text-sm font-bold text-white leading-none">Clarence&apos;s Spotify</h2>
                  <p className="text-[10px] text-white/40 mt-0.5">Live music activity</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-8 h-8 text-[#1DB954] animate-spin" />
                  <p className="text-sm text-white/40">Loading Spotify data…</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <Music2 className="w-8 h-8 text-white/20" />
                  <p className="text-sm text-white/40">{error}</p>
                </div>
              ) : (
                <>
                  {/* Now Playing */}
                  <div>
                    {data?.nowPlaying
                      ? <NowPlayingCard track={data.nowPlaying} />
                      : <OfflineCard />}
                  </div>

                  {/* Tabs */}
                  {(data?.topTracks?.length ?? 0) > 0 || (data?.recentTracks?.length ?? 0) > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-1">
                        <TabBtn
                          active={tab === "top"}
                          onClick={() => setTab("top")}
                          icon={<TrendingUp className="w-3 h-3" />}
                          label="Top Tracks"
                        />
                        <TabBtn
                          active={tab === "recent"}
                          onClick={() => setTab("recent")}
                          icon={<History className="w-3 h-3" />}
                          label="Recently Played"
                        />
                      </div>

                      <div className="space-y-0.5">
                        {tab === "top" && data?.topTracks.map((t, i) => (
                          <TrackRow key={i} track={t} index={i} showIndex />
                        ))}
                        {tab === "recent" && data?.recentTracks.map((t, i) => (
                          <TrackRow
                            key={i}
                            track={t}
                            index={i}
                            meta={t.playedAt ? timeAgo(t.playedAt) : undefined}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/[0.07] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 text-[10px] text-white/25">
                <Clock className="w-3 h-3" />
                <span>Updates every 60s</span>
              </div>
              <a
                href="https://open.spotify.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-[#1DB954]/60 hover:text-[#1DB954] transition-colors"
              >
                Open Spotify
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}