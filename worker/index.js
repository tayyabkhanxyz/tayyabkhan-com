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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') return methodNotAllowed('POST');
      return contact({ request, env });
    }

    if (url.pathname === '/api/subscribers') {
      if (request.method !== 'GET') return methodNotAllowed('GET');
      return subscribers({ request, env });
    }

    // The site itself. Note this Worker is only reached when NO static asset
    // matches the path -- Cloudflare serves assets at the edge without running
    // it. That is why the www redirect and the security headers live in
    // _redirects and _headers, not here.
    return env.ASSETS.fetch(request);
  },
};

function methodNotAllowed(allowed) {
  return new Response(JSON.stringify({ error: 'method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: allowed },
  });
}
