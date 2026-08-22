# tayyabkhan.com

Live at **https://tayyabkhan.com** (and `www`). Static HTML — no build step, no framework.

    /                          home
    /about/                    the person
    /youtube-video-editing/    client work
    /photography/              41 street photographs
    /youtube/                  his own channel
    /contact/                  the form

    assets/css/site.css        the whole stylesheet
    assets/js/site.js          the whole script
    worker/index.js            entry point: routes /api/*, serves everything else
    functions/api/*.js         the two API handlers
    wrangler.jsonc             deploy config + non-secret vars
    .assetsignore              keeps source out of the published site
    bump-assets.sh             re-stamps css/js cache-busting hashes

## Deploying

Push to `main`. Cloudflare rebuilds and it's live in about a minute. That's the whole workflow.

    git add -A && git commit -m "..." && git push

**Run `./bump-assets.sh` after editing `site.css` or `site.js`**, before committing. It stamps
both with a content hash so browsers can't serve a stale copy.

## How it's wired — read this before changing the plumbing

Cloudflare deployed this as a **Worker with static assets, not a Pages project**. That matters:

- The Pages `functions/` convention does **not** route by itself. `worker/index.js` is the real
  entry point — it dispatches `/api/contact` and `/api/subscribers` to the handlers in
  `functions/api/`, and hands everything else to `env.ASSETS.fetch()`.
- `wrangler deploy` treats `wrangler.jsonc` as authoritative for plain variables, so **anything
  set only in the Cloudflare dashboard is wiped on the next push**. Non-secret config therefore
  lives in `wrangler.jsonc`; only real secrets go in the dashboard.
- Cloudflare has **two** panels called "Variables and secrets". The one nested under **Build** is
  invisible to the running Worker. Use the top-level one.

## Environment

Set in Cloudflare → `tayyabkhan-com` → Settings → Variables and Secrets:

| Name | Type | Notes |
|---|---|---|
| `RESEND_API_KEY` | **Secret** | contact form. Never commit this. |
| `YOUTUBE_API_KEY` | Secret | *optional*. Without it the subscriber count uses a public, keyless source. |

`TO_EMAIL` and `FROM_EMAIL` are in `wrangler.jsonc` — not secret, and already public on the site.

## Local

    python3 -m http.server 5511

Serves the static pages. The `/api/*` routes only exist on the deployed Worker, and the site
degrades gracefully without them: the form shows the email address, the counter shows its last
known figure.
