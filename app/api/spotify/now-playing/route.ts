import { NextResponse } from "next/server";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN!;

const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_ENDPOINT = "https://api.spotify.com/v1/me/player/currently-playing";
const TOP_TRACKS_ENDPOINT = "https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=short_term";
const RECENTLY_PLAYED_ENDPOINT = "https://api.spotify.com/v1/me/player/recently-played?limit=5";

async function getAccessToken() {
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
    next: { revalidate: 0 },
  });
  return res.json();
}

export async function GET() {
  try {
    const { access_token } = await getAccessToken();

    const [nowPlayingRes, topTracksRes, recentRes] = await Promise.all([
      fetch(NOW_PLAYING_ENDPOINT, {
        headers: { Authorization: `Bearer ${access_token}` },
        next: { revalidate: 0 },
      }),
      fetch(TOP_TRACKS_ENDPOINT, {
        headers: { Authorization: `Bearer ${access_token}` },
        next: { revalidate: 60 },
      }),
      fetch(RECENTLY_PLAYED_ENDPOINT, {
        headers: { Authorization: `Bearer ${access_token}` },
        next: { revalidate: 0 },
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
    const topTracks = topTracksData?.items?.map((t: {
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
    })) ?? [];

    // Recently played
    const recentData = recentRes.ok ? await recentRes.json() : null;
    const recentTracks = recentData?.items?.map((item: {
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
    })) ?? [];

    return NextResponse.json({ nowPlaying, topTracks, recentTracks });
  } catch (err) {
    console.error("Spotify API error:", err);
    return NextResponse.json({ error: "Failed to fetch Spotify data" }, { status: 500 });
  }
}