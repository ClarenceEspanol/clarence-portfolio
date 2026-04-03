import { redirect } from "next/navigation";

// One-time page to kick off Spotify OAuth and get your refresh token.
// Visit /spotify-auth, authorize, then copy the refresh_token from the callback page.
// After setup, you can delete this file.
export default function SpotifyAuthPage() {
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
  const REDIRECT_URI =
    process.env.SPOTIFY_REDIRECT_URI ?? "https://clrnxvt.vercel.app/api/spotify/callback";

  const scopes = [
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-top-read",
    "user-read-recently-played",
  ].join(" ");

  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  redirect(authUrl);
}