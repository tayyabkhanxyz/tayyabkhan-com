# tayyabkhan.com

Static site. No build step — plain HTML, one stylesheet, one script.

    /                          home
    /about/                    the person
    /youtube-video-editing/    client work
    /photography/              street work
    /youtube/                  own channel
    /functions/api/contact.js  Cloudflare Pages Function behind the contact form

## Local

    python3 -m http.server 5511

## Deploy

1. Push this folder to a GitHub repo.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → connect the repo.
   Build command: *(none)*. Output directory: `/`.
3. Add the custom domain `tayyabkhan.com` in the Pages project.
4. Settings → Variables → add `RESEND_API_KEY`, `TO_EMAIL`, `FROM_EMAIL`
   (see the comment at the top of `functions/api/contact.js`).

## Still to do

- Confirm the "starting from" price in `/youtube-video-editing/index.html` (marked `EDIT`).
- LinkedIn URL in every footer (marked `EDIT`).
- Replace the derived ink portrait with a real hand-drawn one.
