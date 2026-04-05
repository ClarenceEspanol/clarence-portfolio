// Force Node.js runtime — keeps this out of Vercel's Edge Request quota entirely.
// Edge Functions are billed per-invocation; Serverless (Node.js) uses GB-hours,
// which is far more generous on the Hobby plan.
export const runtime = "nodejs";

import { NextResponse } from "next/server";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN!;

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_ENDPOINT = "https://api.spotify.com/v1/me/player/currently-playing";
const TOP_TRACKS_ENDPOINT = "https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=short_term";
const RECENTLY_PLAYED_ENDPOINT = "https://api.spotify.com/v1/me/player/recently-played?limit=5";

// ── In-memory token cache ─────────────────────────────────────────────────────
// Spotify access tokens live for 3600s. Caching avoids a token round-trip on
// every request — saves 1 extra outbound fetch per poll cycle.
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < cachedToken.expiresAt) return cachedToken.token;

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: REFRESH_TOKEN,
    }),
  });

  const json = await res.json();
  // Cache for 55 min (token lasts 60 min — 5 min safety margin)
  cachedToken = { token: json.access_token, expiresAt: now + 55 * 60 * 1000 };
  return json.access_token;
}

export async function GET() {
  try {
    const access_token = await getAccessToken();

    const [nowPlayingRes, topTracksRes, recentRes] = await Promise.all([
      // no-store: always fresh — this is the live "what's playing right now" data
      fetch(NOW_PLAYING_ENDPOINT, {
        headers: { Authorization: `Bearer ${access_token}` },
        cache: "no-store",
      }),
      // revalidate: 300 (5 min) — top tracks don't change song-by-song
      fetch(TOP_TRACKS_ENDPOINT, {
        headers: { Authorization: `Bearer ${access_token}` },
        next: { revalidate: 300 },
      }),
      // revalidate: 120 (2 min) — recently played is semi-static between songs
      fetch(RECENTLY_PLAYED_ENDPOINT, {
        headers: { Authorization: `Bearer ${access_token}` },
        next: { revalidate: 120 },
      }),
    ]);

    // Now playing (204 = nothing playing)
    let nowPlaying = null;
    if (nowPlayingRes.status === 200) {
      const data = await nowPlayingRes.json();
      if (data?.item) {
        nowPlaying = {
          isPlaying: data.is_playing,
          title: data.item.name,
          artist: data.item.artists.map((a: { name: string }) => a.name).join(", "),
          album: data.item.album.name,
          albumArt: data.item.album.images[0]?.url ?? null,
          songUrl: data.item.external_urls.spotify,
          duration: data.item.duration_ms,
          progress: data.progress_ms,
        };
      }
    }

    // Top tracks
    const topTracksData = topTracksRes.ok ? await topTracksRes.json() : null;
    const topTracks =
      topTracksData?.items?.map(
        (t: {
          name: string;
          artists: { name: string }[];
          album: { name: string; images: { url: string }[] };
          external_urls: { spotify: string };
          duration_ms: number;
        }) => ({
          title: t.name,
          artist: t.artists.map((a) => a.name).join(", "),
          album: t.album.name,
          albumArt: t.album.images[0]?.url ?? null,
          songUrl: t.external_urls.spotify,
          duration: t.duration_ms,
        })
      ) ?? [];

    // Recently played
    const recentData = recentRes.ok ? await recentRes.json() : null;
    const recentTracks =
      recentData?.items?.map(
        (item: {
          track: {
            name: string;
            artists: { name: string }[];
            album: { name: string; images: { url: string }[] };
            external_urls: { spotify: string };
            duration_ms: number;
          };
          played_at: string;
        }) => ({
          title: item.track.name,
          artist: item.track.artists.map((a) => a.name).join(", "),
          album: item.track.album.name,
          albumArt: item.track.album.images[0]?.url ?? null,
          songUrl: item.track.external_urls.spotify,
          duration: item.track.duration_ms,
          playedAt: item.played_at,
        })
      ) ?? [];

    // Cache the full response for 60s on Vercel's CDN edge.
    // Multiple simultaneous visitors hitting the modal won't each trigger a
    // cold serverless invocation — they all get the same cached response.
    return NextResponse.json(
      { nowPlaying, topTracks, recentTracks },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      }
    );
  } catch (err) {
    console.error("Spotify API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch Spotify data" },
      { status: 500 }
    );
  }
}