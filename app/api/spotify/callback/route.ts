import { NextRequest, NextResponse } from "next/server";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI ?? "https://clrnxvt.vercel.app/api/spotify/callback";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.json({ error: error ?? "Missing code" }, { status: 400 });
  }

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    return NextResponse.json({ error: tokenData }, { status: 500 });
  }

  // Show the refresh token so you can copy it into your .env
  return new NextResponse(
    `<!DOCTYPE html>
<html>
<head><title>Spotify Auth Success</title>
<style>
  body { font-family: monospace; background: #0a0a0a; color: #22d3ee; padding: 2rem; }
  .box { background: #111; border: 1px solid #22d3ee33; border-radius: 8px; padding: 1.5rem; margin-top: 1rem; }
  .label { color: #888; font-size: 0.75rem; margin-bottom: 0.25rem; }
  .token { word-break: break-all; color: #fff; font-size: 0.85rem; }
  h2 { color: #22d3ee; }
  p { color: #aaa; }
</style>
</head>
<body>
  <h2>✅ Spotify Auth Success</h2>
  <p>Copy the <strong>refresh_token</strong> below and add it to your <code>.env.local</code> as <code>SPOTIFY_REFRESH_TOKEN</code></p>
  <div class="box">
    <div class="label">SPOTIFY_REFRESH_TOKEN=</div>
    <div class="token">${tokenData.refresh_token}</div>
  </div>
  <div class="box" style="margin-top:0.5rem">
    <div class="label">access_token (temporary):</div>
    <div class="token">${tokenData.access_token}</div>
  </div>
  <p style="margin-top:1.5rem;color:#f87171">⚠️ This page is only for setup. Remove the /api/spotify/callback route or add auth protection once done.</p>
</body>
</html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}