/**
 * Worker entry point.
 *
 * Cloudflare deployed this project as a Worker with static assets rather than
 * a Pages project, so the Pages `functions/` convention never gets wired up.
 * This routes the two API paths to those same handlers and hands everything
 * else to the static asset server, which is what was already serving the site.
 */

import { onRequestPost as contact } from '../functions/api/contact.js';
import { onRequestGet as subscribers } from '../functions/api/subscribers.js';

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/contact') {
      if (request.method !== 'POST') return methodNotAllowed('POST');
      return contact({ request, env });
    }

    if (pathname === '/api/subscribers') {
      if (request.method !== 'GET') return methodNotAllowed('GET');
      return subscribers({ request, env });
    }

    // everything else: the site itself
    return env.ASSETS.fetch(request);
  },
};

function methodNotAllowed(allowed) {
  return new Response(JSON.stringify({ error: 'method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: allowed },
  });
}
