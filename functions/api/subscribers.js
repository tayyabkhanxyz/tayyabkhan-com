/**
 * GET /api/subscribers  —  Cloudflare Pages Function
 *
 * Returns { subscribers: <number> } for the channel.
 *
 * Setup (Cloudflare dashboard -> Pages project -> Settings -> Variables):
 *   YOUTUBE_API_KEY   secret. Create at console.cloud.google.com:
 *                     enable "YouTube Data API v3", make an API key,
 *                     restrict it to that API. Free quota is far more
 *                     than this needs.
 *   CHANNEL_ID        optional, defaults to the id below.
 *
 * The response is cached at the edge for 60s so repeat visitors don't
 * burn quota. Without a key it returns 503 and the page falls back to
 * the last known figure baked into the HTML.
 */

const DEFAULT_CHANNEL = 'UCQ6UAl-Xsef7qXmICd0l0hQ';

export async function onRequestGet({ env }) {
  const key = env.YOUTUBE_API_KEY;
  if (!key) return json({ error: 'not configured' }, 503);

  const id = env.CHANNEL_ID || DEFAULT_CHANNEL;
  const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${id}&key=${key}`;

  const res = await fetch(url, { cf: { cacheTtl: 60, cacheEverything: true } });
  if (!res.ok) return json({ error: 'upstream' }, 502);

  const data = await res.json();
  const stats = data?.items?.[0]?.statistics;
  if (!stats) return json({ error: 'no channel' }, 404);

  return json(
    {
      subscribers: Number(stats.subscriberCount),
      views: Number(stats.viewCount),
      videos: Number(stats.videoCount),
    },
    200,
    { 'Cache-Control': 'public, max-age=60' }
  );
}

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  });
}
