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
