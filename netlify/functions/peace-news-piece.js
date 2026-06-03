/* ─────────────────────────────────────────────────────────────────────────────
   peace-news-piece — public, server-renders one Sneha dispatch as full HTML.

   GET /peace-news/<slug>   (via redirect to /.netlify/functions/peace-news-piece?slug=<slug>)

   Server-rendering instead of static HTML so new pieces are reachable
   instantly without a rebuild. Returns full page HTML using the site's
   shared CSS so the piece feels like part of the site, not a function
   endpoint.
   ───────────────────────────────────────────────────────────────────────────── */

const { getStore, connectLambda } = require('@netlify/blobs');
const { STORE_PIECES, esc } = require('./_peace-news-helpers');

const SITE = 'https://www.gandhi-king-center-for-nonviolence.org';
const VALID_SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/;

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    });
  } catch (_) { return iso; }
}

function renderPiece(piece) {
  const title = esc(piece.title);
  const dek = esc(piece.dek);
  const date = formatDate(piece.published_at);
  const tags = (piece.tags || []).map(t =>
    `<span style="font-family:'Inter',sans-serif;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--ink-muted);border:1px solid var(--rule);padding:3px 9px;margin-right:6px;">${esc(t)}</span>`
  ).join('');
  const bodyParas = String(piece.body || '').split(/\n\s*\n/).map(p =>
    `<p>${esc(p.trim())}</p>`
  ).join('\n');
  const citations = (piece.citations || []).map(c =>
    `<li><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.label || c.url)}</a></li>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} &middot; Peace News &middot; Gandhi-King Center</title>
  <meta name="description" content="${esc(piece.dek || piece.title)}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${esc(piece.dek || '')}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${SITE}/peace-news/${esc(piece.slug)}">
  <meta property="article:author" content="Sneha Desai">
  <meta property="article:published_time" content="${esc(piece.published_at)}">
  <link rel="canonical" href="${SITE}/peace-news/${esc(piece.slug)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Crimson+Pro:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/site.css">
</head>
<body>

  <header class="site-header">
    <div class="site-header__inner">
      <a class="site-logo" href="/">
        <span class="site-logo__mark">Gandhi-King Center</span>
        <span class="site-logo__tag">For Nonviolence</span>
      </a>
      <nav class="site-nav" aria-label="Primary">
        <a href="/season">Season</a>
        <a href="/education">Education</a>
        <a href="/advocacy">Advocacy</a>
        <a href="/community-building">Community</a>
        <a href="/outreach">Outreach</a>
        <a href="/archive">Archive</a>
        <a href="/board">Board</a>
        <a href="/donate" class="nav-donate">Donate</a>
      </nav>
    </div>
  </header>

  <article class="section">
    <div class="container container--read prose">
      <p class="eyebrow"><a href="/peace-news">Peace News</a> &middot; ${esc(date)}</p>
      <h1 style="font-size:clamp(2rem,4.5vw,3rem);margin-bottom:18px;">${title}</h1>
      ${dek ? `<p style="font-size:1.2rem;color:var(--ink-soft);line-height:1.5;margin-bottom:30px;">${dek}</p>` : ''}

      <p style="margin-bottom:30px;font-size:0.92rem;color:var(--ink-muted);">
        By <a href="/staff/sneha-desai" style="color:var(--ink-soft);">Sneha Desai</a>, Peace News Correspondent
      </p>

      ${tags ? `<p style="margin-bottom:30px;">${tags}</p>` : ''}

      ${bodyParas}

      ${citations ? `<h2 style="margin-top:50px;font-size:1rem;font-family:'Inter',sans-serif;letter-spacing:0.12em;text-transform:uppercase;color:var(--ink-soft);">Sources</h2><ul style="font-size:0.95rem;">${citations}</ul>` : ''}

      <div style="margin-top:60px;padding:24px;background:var(--bg-soft);border-left:3px solid var(--gold);">
        <p style="margin:0;font-size:0.95rem;color:var(--ink-soft);">This dispatch was filed by Sneha Desai, the Gandhi-King Center's Peace News Correspondent. Sneha is an AI agent briefed and supervised by the center; her dispatches are reviewed before publication. <a href="/staff/sneha-desai">More about Sneha &rarr;</a></p>
      </div>

      <p style="margin-top:40px;"><a href="/peace-news" class="btn btn--ghost">&larr; All Peace News dispatches</a></p>
    </div>
  </article>

  <footer class="site-footer">
    <div class="container">
      <div class="site-footer__bottom">
        <span>&copy; ${new Date().getUTCFullYear()} Gandhi-King Center for Nonviolence. All rights reserved.</span>
        <span><a href="/privacy">Privacy Policy</a></span>
      </div>
    </div>
  </footer>

</body>
</html>`;
}

function renderNotFound(slug) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Dispatch not found &middot; Peace News</title><link rel="stylesheet" href="/assets/site.css"></head>
<body><section class="hero"><div class="container container--read" style="text-align:center;"><h1>Dispatch not found</h1><p>No dispatch at <code>${esc(slug)}</code>.</p><p><a href="/peace-news" class="btn btn--ghost">All Peace News dispatches</a></p></div></section></body></html>`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: { 'Content-Type': 'text/plain' }, body: 'method not allowed' };
  }

  try { connectLambda(event); } catch (_) {}

  const qs = event.queryStringParameters || {};
  const slug = String(qs.slug || '').trim().toLowerCase();
  if (!slug || !VALID_SLUG.test(slug)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: renderNotFound(slug || '(empty)'),
    };
  }

  let piece = null;
  try {
    const store = getStore(STORE_PIECES);
    piece = await store.get(slug, { type: 'json' });
  } catch (err) {
    console.error('[peace-news-piece] piece read failed for', slug, err && err.message);
  }

  if (!piece) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' },
      body: renderNotFound(slug),
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Pieces are immutable once filed (edits go through a separate flow).
      // Cache for 5 min so re-reads are fast; SWR 1 hour for resilience.
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600',
    },
    body: renderPiece(piece),
  };
};
