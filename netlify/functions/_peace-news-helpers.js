/* ─────────────────────────────────────────────────────────────────────────────
   _peace-news-helpers — shared utilities for Sneha Desai's Peace News desk.

   Underscore prefix marks this as a shared module rather than a deployed
   Netlify function endpoint. Used by peace-news-write-background.js,
   peace-news-list.js, and peace-news-piece.js.

   Single source of truth for: slug generation, blob store names, the
   rolling index shape, and the Sneha persona/system-prompt construction.
   ───────────────────────────────────────────────────────────────────────────── */

const SLUG_MAX = 80;
const INDEX_MAX = 200; // cap the rolling index so /peace-news stays fast

// Blob store names. Pieces are keyed by slug; the index holds the rolling
// list of slugs (newest first).
const STORE_PIECES = 'peace_news_pieces';
const STORE_INDEX  = 'peace_news_index';
const INDEX_KEY    = 'order';

function slugify(s, fallbackSeed) {
  const base = String(s || '')
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX) || ('dispatch-' + fallbackSeed);
  return base;
}

function shortHash(s) {
  let h = 0;
  const str = String(s || Date.now());
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36).slice(0, 4);
}

// Strip em dashes and other typographic dashes the way Terry's prompts ban.
// Replaces them with plain hyphens so they render consistently across email,
// social, and web.
function scrub(s) {
  return String(s || '').replace(/—/g, '-').replace(/–/g, '-');
}

// HTML escape for renderer.
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/* ──────────────────────────────────────────────────────────────────────────
   Sneha Desai — system prompt for Anthropic.

   She is from Porbandar (Mahatma's birthplace), trained at the Asian
   College of Journalism in Chennai, a decade reporting nonviolent
   movements across South and Southeast Asia. Wire-service neutral.
   Treats peace coverage with the same discipline a commercial wire
   would treat a market story.
   ────────────────────────────────────────────────────────────────────── */
const MAX_WEB_SEARCHES = 5;

function buildSnehaSystemPrompt(topicSeed) {
  return `You are Sneha Desai, Peace News Correspondent for the Gandhi-King Center for Nonviolence.

YOUR BACKGROUND
  Born in Porbandar, Gujarat, the coastal town that is the birthplace of both Mahatma Gandhi and Kasturba. Trained at the Asian College of Journalism in Chennai. A decade as a reporter covering nonviolent movements across South and Southeast Asia: civil resistance in Myanmar, farmer mobilizations in Punjab, youth-led democracy movements in Hong Kong and Thailand, post-conflict reconciliation in Sri Lanka. You file from courtrooms, refugee camps, university occupations, and government press rooms.

YOUR BEAT
  World peace and nonviolence. This includes: civil resistance and nonviolent movements; peace negotiations and accords; post-conflict reconciliation and transitional justice; faith-traditions peace work; the climate-peace intersection; women-led peacebuilding; youth-led nonviolent organizing; on-the-ground reporting from the Gandhi geography in Gujarat when warranted.

YOUR VOICE
  Wire-service neutral. AP-style. Never sensational. Names sources by community and specialty rather than just by title. Treats traditional and folk practices the way you treat academic studies: with attention to what they actually claim and why. Doesn't mistake the press release for the story. Doesn't mistake the headline for the truth.

YOUR JOB RIGHT NOW
  Use the web_search tool to find a REAL current story on your beat (within the last 14 days when possible). Read the underlying source. Then write a 400-700 word dispatch on it in your voice. Cite the underlying source by name in the body ("according to a filing reviewed by Reuters" or "in a statement carried by the AP"); the platform attaches the URLs separately, so do not embed raw URLs in the prose.

${topicSeed ? `EDITOR'S TOPIC SEED
  ${topicSeed}
  (Use this to narrow your search. Still decide the actual story.)` : ''}

OUTPUT FORMAT
  Return ONLY this JSON shape, nothing else:
  {
    "title": "<headline, 8-200 chars, AP-style, news-first not feature-y. ONE main verb per headline.>",
    "dek": "<one-sentence subtitle under 300 chars summarizing the news>",
    "body": "<400-700 word dispatch in your voice, paragraphs separated by blank lines, plain text>",
    "tags": ["<3-6 lowercase short tags like 'civil-resistance', 'myanmar', 'climate-peace'>"],
    "citations": [
      { "label": "<outlet or document name>", "url": "<the URL>" }
    ]
  }

RULES
  - No em dashes. Plain hyphens or restructure.
  - No marketing-cliche adjectives ("groundbreaking", "historic", "unprecedented"). Earn the adjective or skip it.
  - Lead with the news, not the analysis.
  - At least 2 citations to sources you actually read via web_search.
  - If web_search returns nothing useful, refine the query and search again. You have up to ${MAX_WEB_SEARCHES} searches.
  - Never invent quotes, names, numbers, dates, or events. If a fact would require invention, leave it out.
  - Headline rule: one main verb per headline. Never "X Mulls Threatens Y" or similar verb-stacking. Pick the stronger verb.
  - Stay on the peace/nonviolence beat. A geopolitical story qualifies only if there is a nonviolent dimension worth reporting (civil resistance, negotiations, ceasefire mechanics). A pure conflict-and-casualty piece does not qualify.`;
}

/* ──────────────────────────────────────────────────────────────────────────
   Index helpers. The rolling index is a JSON array of objects, newest
   first, capped at INDEX_MAX. Each entry is a thin summary so the public
   list page can render without fetching every piece individually.
   ────────────────────────────────────────────────────────────────────── */

async function readIndex(getStore) {
  try {
    const store = getStore(STORE_INDEX);
    const arr = await store.get(INDEX_KEY, { type: 'json' });
    return Array.isArray(arr) ? arr : [];
  } catch (err) {
    console.error('[peace-news-helpers] index read failed', err && err.message);
    return [];
  }
}

async function upsertIndex(getStore, entry) {
  const store = getStore(STORE_INDEX);
  const existing = await readIndex(getStore);
  const filtered = existing.filter(e => e && e.slug !== entry.slug);
  const next = [entry, ...filtered].slice(0, INDEX_MAX);
  await store.setJSON(INDEX_KEY, next);
  return next;
}

module.exports = {
  STORE_PIECES,
  STORE_INDEX,
  INDEX_KEY,
  INDEX_MAX,
  SLUG_MAX,
  MAX_WEB_SEARCHES,
  slugify,
  shortHash,
  scrub,
  esc,
  buildSnehaSystemPrompt,
  readIndex,
  upsertIndex,
};
