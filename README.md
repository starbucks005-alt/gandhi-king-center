# Gandhi-King Center for Nonviolence

A 501(c)(3) private foundation based in Dayton, Ohio.
EIN 99-3986935.

The center carries forward the Season for Nonviolence — the 64-day observance founded by Arun Gandhi in 1998 — and stewards the digital home of a board that includes direct family of Mahatma Gandhi and Dr. Martin Luther King Jr.

## Stack

- Multi-page HTML + inline CSS (no build step for V1)
- Hosted on Netlify, deployed on push to `main`
- No Netlify Functions in V1 (pure static)
- Future surfaces will add: Joel King voice clone (ElevenLabs), peace newsroom (Anthropic + web search), newsletter (Supabase), kids/schools education layer

## Local preview

Just open `index.html` in a browser. There is no build step.

For Netlify-style local dev with redirects working:
```
netlify dev
```

## Deploy

Push to `main`. Netlify auto-deploys. Do not run `netlify deploy` from CLI. Do not create branches.

## Structure

- `index.html` — homepage, Season for Nonviolence as spine
- `board.html` — full 9-member board with bios
- `donate.html` — PayPal-powered donation page with 501(c)(3) disclosure
- `education.html` / `advocacy.html` / `community-building.html` / `outreach.html` — the four pillars
- `events.html` — current and upcoming engagements (Gandhi Legacy Tour, Peace Camp, etc.)
- `season-for-nonviolence.html` — deeper page on the 64-day calendar, Arun-founded provenance
- `peace-partners.html` — partner organizations (skeleton)
- `blog/` — published posts
- `contact.html`, `privacy.html`, `404.html`
- `assets/` — fonts, images, shared CSS

## Contact

Admin@gandhi-king-center-for-nonviolence.org
109 North Main Street, Suite 1206, Dayton, OH 45402-1294
