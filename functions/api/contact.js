/**
 * POST /api/contact  —  Cloudflare Pages Function
 *
 * Setup (once, in the Cloudflare dashboard → Pages project → Settings → Variables):
 *   RESEND_API_KEY   secret, from https://resend.com  (free tier: 3,000 emails/month)
 *   TO_EMAIL         where enquiries land, e.g. tayyabkhanwork@gmail.com
 *   FROM_EMAIL       a verified sender on your domain, e.g. site@tayyabkhan.com
 *
 * Until those exist the endpoint returns 500 and the form falls back to
 * showing the mailto address, so nothing is silently lost.
 */

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'bad request' }, 400);
  }

  const name = (data.name || '').trim();
  const email = (data.email || '').trim();
  const about = (data.about || 'unspecified').trim();
  const message = (data.message || '').trim();

  if (!name || !email || !message) return json({ error: 'missing fields' }, 400);
  if (name.length > 120 || email.length > 200 || message.length > 5000)
    return json({ error: 'too long' }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'bad email' }, 400);

  if (!env.RESEND_API_KEY || !env.TO_EMAIL || !env.FROM_EMAIL)
    return json({ error: 'not configured' }, 500);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `tayyabkhan.com <${env.FROM_EMAIL}>`,
      to: [env.TO_EMAIL],
      reply_to: email,
      subject: `${about} — ${name}`,
      html:
        `<p><b>${esc(name)}</b> &lt;${esc(email)}&gt;</p>` +
        `<p><i>${esc(about)}</i></p><hr>` +
        `<p style="white-space:pre-wrap">${esc(message)}</p>`,
    }),
  });

  if (!res.ok) return json({ error: 'send failed' }, 502);
  return json({ ok: true });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
