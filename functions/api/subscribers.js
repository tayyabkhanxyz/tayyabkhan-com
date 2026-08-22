/**
 * GET /api/subscribers  ->  { subscribers, views, videos, source }
 *
 * Two ways of getting the number, tried in order:
 *
 *  1. A public counts API. No key, no account, nothing to set up. This is
 *     what runs today. It is an unofficial third party, so if it ever goes
 *     away or changes shape, the endpoint fails and the page keeps showing
 *     the last known figure baked into the HTML.
 *
 *  2. YouTube Data API v3, used automatically IF a YOUTUBE_API_KEY secret
 *     exists on the Worker. Official and dependable. Add the key in
 *     Settings -> Variables and Secrets and this takes over on its own,
 *     no code change needed.
 *
 * Env (all optional):
 *   YOUTUBE_API_KEY   enables route 2
 *   CHANNEL_ID        defaults to the id below
 */

const DEFAULT_CHANNEL = 'UCQ6UAl-Xsef7qXmICd0l0hQ';

export async function onRequestGet({ env }) {
  const id = (env && env.CHANNEL_ID) || DEFAULT_CHANNEL;

  if (env && env.YOUTUBE_API_KEY) {
    const official = await fromYouTube(id, env.YOUTUBE_API_KEY);
    if (official) return json(official);
  }

  const public_ = await fromPublicCounter(id);
  if (public_) return json(public_);

  return json({ error: 'unavailable' }, 502);
}

async function fromYouTube(id, key) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${id}&key=${key}`;
    const res = await fetch(url, { cf: { cacheTtl: 60, cacheEverything: true } });
    if (!res.ok) return null;
    const s = (await res.json())?.items?.[0]?.statistics;
    if (!s) return null;
    return {
      subscribers: Number(s.subscriberCount),
      views: Number(s.viewCount),
      videos: Number(s.videoCount),
      source: 'youtube',
    };
  } catch {
    return null;
  }
}

async function fromPublicCounter(id) {
  try {
    const res = await fetch(`https://api.socialcounts.org/youtube-live-subscriber-count/${id}`, {
      cf: { cacheTtl: 60, cacheEverything: true },
    });
    if (!res.ok) return null;
    const c = (await res.json())?.counters;
    const n = c?.api?.subscriberCount ?? c?.estimation?.subscriberCount;
    if (typeof n !== 'number') return null;
    return {
      subscribers: n,
      views: c?.api?.viewCount ?? c?.estimation?.viewCount ?? null,
      videos: c?.api?.videoCount ?? c?.estimation?.videoCount ?? null,
      source: 'public',
    };
  } catch {
    return null;
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
  });
}
