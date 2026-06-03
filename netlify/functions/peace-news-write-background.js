/* ─────────────────────────────────────────────────────────────────────────────
   peace-news-write-background — Sneha Desai files a new dispatch.

   Background-function variant (-background.js suffix → Netlify runs it up
   to 15 minutes). Anthropic + web_search routinely takes 30-120 seconds,
   so a foreground 10-second function would time out and return HTML that
   crashes the admin UI's JSON parser.

   POST /.netlify/functions/peace-news-write-background
   Body: { topic_seed?: string }     // optional editor seed to narrow search

   Auth: HTTP Basic via GK_ADMIN_USER + GK_ADMIN_PASS env vars.
   Response: 202 immediately. Sneha writes in the background; the dispatch
   appears on /peace-news in 60-180 seconds when ready.

   Storage:
     peace_news_pieces/<slug>   — full piece JSON
     peace_news_index/order      — rolling list of {slug, title, dek, ...},
                                   newest first, capped at 200 entries
   ───────────────────────────────────────────────────────────────────────────── */

const Anthropic = require('@anthropic-ai/sdk').default;
const { getStore, connectLambda } = require('@netlify/blobs');

const {
  STORE_PIECES,
  MAX_WEB_SEARCHES,
  slugify,
  shortHash,
  scrub,
  buildSnehaSystemPrompt,
  upsertIndex,
} = require('./_peace-news-helpers');

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 2400;

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

function requireBasicAuth(event) {
  const user = process.env.GK_ADMIN_USER;
  const pass = process.env.GK_ADMIN_PASS;
  if (!user || !pass) return { ok: false, response: { statusCode: 503, body: 'admin disabled' } };
  const header = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  if (!header.toLowerCase().startsWith('basic ')) {
    return { ok: false, response: { statusCode: 401, headers: { 'WWW-Authenticate': 'Basic realm="GK Admin"' }, body: 'auth required' } };
  }
  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf-8');
    const idx = decoded.indexOf(':');
    if (idx === -1) throw new Error('malformed');
    const u = decoded.slice(0, idx);
    const p = decoded.slice(idx + 1);
    if (u !== user || p !== pass) {
      return { ok: false, response: { statusCode: 401, headers: { 'WWW-Authenticate': 'Basic realm="GK Admin"' }, body: 'invalid credentials' } };
    }
  } catch {
    return { ok: false, response: { statusCode: 401, headers: { 'WWW-Authenticate': 'Basic realm="GK Admin"' }, body: 'invalid auth' } };
  }
  return { ok: true };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'method not allowed' });
  const auth = requireBasicAuth(event);
  if (!auth.ok) return auth.response;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json(500, { error: 'ANTHROPIC_API_KEY not configured' });

  try { connectLambda(event); } catch (err) {
    console.error('[peace-news-write] connectLambda failed', err && err.message);
    return json(500, { error: 'blobs connect failed' });
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return json(400, { error: 'invalid json' }); }

  const topic_seed = String(body.topic_seed || '').trim().slice(0, 500);

  // Background function: await inline so the lambda container stays alive.
  // Netlify auto-returns 202 to the caller; this handler runs up to 15 min.
  try {
    const result = await runSneha(topic_seed, apiKey);
    return json(200, { ok: true, ...result });
  } catch (err) {
    console.error('[peace-news-write] runSneha error', err && err.message);
    return json(500, { ok: false, error: err && err.message });
  }
};

async function runSneha(topic_seed, apiKey) {
  const client = new Anthropic({ apiKey });
  console.log('[peace-news-write] sneha drafting', topic_seed ? `seed=${topic_seed}` : '(no seed)');

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: buildSnehaSystemPrompt(topic_seed),
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: MAX_WEB_SEARCHES }],
    messages: [{ role: 'user', content: 'Find a real current story on the world peace and nonviolence beat and file a dispatch. JSON only.' }],
  });

  const raw = (response.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n')
    .trim();
  if (!raw) {
    console.error('[peace-news-write] empty response from anthropic');
    throw new Error('empty response from anthropic');
  }

  let parsed;
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match ? match[0] : raw);
  } catch (err) {
    console.error('[peace-news-write] JSON parse failed', err && err.message, 'raw:', raw.slice(0, 400));
    throw new Error('script JSON parse failed: ' + (err && err.message));
  }

  // Scrub em dashes, normalize fields.
  parsed.title = scrub(parsed.title);
  parsed.dek   = scrub(parsed.dek);
  parsed.body  = scrub(parsed.body);
  if (Array.isArray(parsed.tags)) parsed.tags = parsed.tags.map(t => String(t).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)).filter(Boolean).slice(0, 8);
  if (Array.isArray(parsed.citations)) {
    parsed.citations = parsed.citations
      .map(c => ({ label: scrub(c.label || ''), url: String(c.url || '').trim() }))
      .filter(c => c.url);
  }

  if (!parsed.title || !parsed.body) {
    throw new Error('reporter returned empty title or body');
  }

  // Generate slug + assemble piece.
  const now = new Date().toISOString();
  const slug = slugify(parsed.title, shortHash(parsed.title + now));
  const piece = {
    slug,
    title: parsed.title,
    dek: parsed.dek || '',
    body: parsed.body,
    tags: parsed.tags || [],
    citations: parsed.citations || [],
    author: 'Sneha Desai',
    author_slug: 'sneha-desai',
    desk: 'peace-news',
    published_at: now,
    topic_seed: topic_seed || null,
  };

  // Write the piece.
  const piecesStore = getStore(STORE_PIECES);
  try {
    await piecesStore.setJSON(slug, piece);
  } catch (err) {
    console.error('[peace-news-write] piece store write failed', err && err.message);
    throw new Error('piece store write failed: ' + (err && err.message));
  }

  // Update the rolling index. Thin entry; the public list page renders from
  // this without needing to fetch every piece.
  try {
    await upsertIndex(getStore, {
      slug,
      title: piece.title,
      dek: piece.dek,
      tags: piece.tags,
      author: piece.author,
      published_at: piece.published_at,
      citations_count: piece.citations.length,
    });
  } catch (err) {
    console.error('[peace-news-write] index update failed (piece saved, list may lag)', err && err.message);
  }

  console.log('[peace-news-write] published', slug, '-', piece.title);
  return { slug, title: piece.title, url: '/peace-news/' + slug };
}
