/**
 * Worker entry point.
 *
 * Cloudflare deployed this project as a Worker with static assets rather than
 * a Pages project, so the Pages `functions/` convention never gets wired up.
 * This routes the two API paths to those same handlers and hands anything else
 * to the static asset server.
 */

import { onRequestPost as contact } from '../functions/api/contact.js';
import { onRequestGet as subscribers } from '../functions/api/subscribers.js';

// Noor's site lives in its own Worker on a different account. /noor/ proxies
// it so the address bar stays on tayyabkhan.com. Safe to proxy because every
// path inside it is relative -- there are no root-absolute references to break.
const NOOR_ORIGIN = 'https://tiny-river-e0cd.tayyabkhanfilmz.workers.dev';

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // one canonical host: www -> apex, permanently
    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }

    // /noor -> /noor/ so the relative links inside it resolve correctly
    if (url.pathname === '/noor') {
      return Response.redirect(new URL('/noor/', url).toString(), 301);
    }

    if (url.pathname.startsWith('/noor/')) {
      const target = new URL(url.pathname.slice('/noor'.length) + url.search, NOOR_ORIGIN);
      const upstream = await fetch(target, {
        method: request.method,
        headers: request.headers,
        body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
        redirect: 'manual',
      });
      const out = new Response(upstream.body, upstream);

      // That site strips .html and answers with root-relative redirects like
      // "/bored". Left alone the browser resolves those against tayyabkhan.com
      // and lands outside /noor entirely, so re-point them back under the path.
      const loc = upstream.headers.get('location');
      if (loc) {
        if (loc.startsWith('/')) out.headers.set('location', '/noor' + loc);
        else if (loc.startsWith(NOOR_ORIGIN)) out.headers.set('location', '/noor' + loc.slice(NOOR_ORIGIN.length));
      }

      // personal page: reachable if he sends the link, invisible to search
      out.headers.set('X-Robots-Tag', 'noindex, nofollow');
      return out;
    }

    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') return methodNotAllowed('POST');
      return contact({ request, env });
    }

    if (url.pathname === '/api/subscribers') {
      if (request.method !== 'GET') return methodNotAllowed('GET');
      return subscribers({ request, env });
    }

    // the site itself, plus headers the static server does not set
    const res = await env.ASSETS.fetch(request);
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
    return out;
  },
};

function methodNotAllowed(allowed) {
  return new Response(JSON.stringify({ error: 'method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: allowed },
  });
}
