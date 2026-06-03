/* ─────────────────────────────────────────────────────────────────────────────
   sm-generate — Ayanna Cole drafts ready-to-post social media copy.

   Foreground function (no web_search → fast, well under 10 sec). Takes a
   brief from admin and returns platform-specific copy in Ayanna's voice:
   X (Twitter), LinkedIn, Instagram caption, Facebook, and a suggested
   set of hashtags. Admin copy-pastes the output into the actual platforms.

   POST /.netlify/functions/sm-generate
   Body: {
     brief:      string  (required, what to post about, 5-2000 chars)
     audience?:  string  (optional, who this targets — donors, educators, families, press)
     cta?:       string  (optional, the call to action — Donate, Register, Read, RSVP, Share)
     platforms?: string[] (optional, subset of ['x','linkedin','instagram','facebook'];
                          defaults to all four)
     tone?:      string  (optional, 'urgent' | 'reflective' | 'celebratory' | 'announcement'; default: announcement)
   }

   Auth: HTTP Basic via GK_ADMIN_USER + GK_ADMIN_PASS env vars.

   Response: {
     ok: true,
     posts: {
       x:         { copy: string, character_count: number, hashtags: string[] },
       linkedin:  { copy: string, character_count: number, hashtags: string[] },
       instagram: { copy: string, character_count: number, hashtags: string[] },
       facebook:  { copy: string, character_count: number, hashtags: string[] }
     }
   }
   ───────────────────────────────────────────────────────────────────────────── */

const Anthropic = require('@anthropic-ai/sdk').default;

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 2400;

const VALID_PLATFORMS = ['x', 'linkedin', 'instagram', 'facebook'];
const PLATFORM_LIMITS = { x: 280, linkedin: 3000, instagram: 2200, facebook: 5000 };
const VALID_TONES = new Set(['urgent', 'reflective', 'celebratory', 'announcement']);

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
    if (decoded.slice(0, idx) !== user || decoded.slice(idx + 1) !== pass) {
      return { ok: false, response: { statusCode: 401, headers: { 'WWW-Authenticate': 'Basic realm="GK Admin"' }, body: 'invalid credentials' } };
    }
  } catch {
    return { ok: false, response: { statusCode: 401, headers: { 'WWW-Authenticate': 'Basic realm="GK Admin"' }, body: 'invalid auth' } };
  }
  return { ok: true };
}

function scrub(s) {
  return String(s || '').replace(/—/g, '-').replace(/–/g, '-');
}

function buildAyannaSystemPrompt(audience, cta, tone, platforms) {
  return `You are Ayanna Cole, Director of Communications for the Gandhi-King Center for Nonviolence.

YOUR BACKGROUND
  Nonprofit communications veteran out of Atlanta. Came up through the Southern Christian Leadership Conference (SCLC) and The King Center, then ran campaign-level communications for civil rights and racial-justice organizations. Quiet, deliberate, ferociously effective.

YOUR VOICE
  SCLC press office, not tech-company brand team. You name what's at stake plainly. You don't perform outrage. You don't use the word "amplify." You quote scripture, Gandhi, or King only when the moment actually calls for it. You treat donors and the public as adults. You don't shout. You don't apologize.

YOUR JOB RIGHT NOW
  Draft ready-to-post social media copy in your voice for the platforms below. Each platform has its own register, character limit, and audience habit. Use them correctly.

PLATFORMS TO DRAFT FOR
  ${platforms.join(', ')}

PER-PLATFORM RULES
  - X (formerly Twitter): 280 character hard limit including hashtags. Direct, scannable, hooky. 1-3 hashtags only. Posts ending with the CTA work best.
  - LinkedIn: up to 3000 chars but the best posts are 800-1500. Slightly more reflective. Lead with a hook line, then context, then CTA. Light use of line breaks. Up to 5 hashtags at the end.
  - Instagram: caption up to 2200 chars but most read 80-150 chars before "more." Lead with a hook. Conversational. Up to 10 hashtags, usually grouped at the end behind line breaks or a "." spacer.
  - Facebook: longest form. Up to 800 chars. More narrative; community-oriented register. 0-3 hashtags (Facebook readers don't use them much). Tag the @page if relevant.

BRIEF CONTEXT
  Audience: ${audience || 'general supporters and the public'}
  Tone: ${tone}
  Call to action: ${cta || 'Learn more / get involved with the Gandhi-King Center'}

CENTER FACTS YOU CAN DRAW ON
  - 501(c)(3) private foundation; EIN 99-3986935; Dayton, OH
  - The board includes Tushar Gandhi (Mahatma's great-grandson), Rev. Joel King (MLK's first cousin), Carolyn Foster and Gregory Foster (Coretta Scott King's family), and others.
  - The Season for Nonviolence runs January 30 to April 4 — the 64 days between the assassinations of Mahatma Gandhi and Dr. King.
  - Founded 2024.

OUTPUT FORMAT
  Return ONLY this JSON shape, nothing else:
  {
    "posts": {
      "x":         { "copy": "<post text>", "hashtags": ["<tag1>", "<tag2>"] },
      "linkedin":  { "copy": "<post text>", "hashtags": ["<tag1>", "<tag2>", "<tag3>"] },
      "instagram": { "copy": "<post text>", "hashtags": ["<tag1>", "<tag2>", "<tag3>"] },
      "facebook":  { "copy": "<post text>", "hashtags": [] }
    }
  }
  Only include the platforms requested. Hashtags should be lowercase without the leading # (the platform UI adds it). Character counts will be computed server-side.

RULES
  - No em dashes (use plain hyphens or restructure).
  - No marketing cliches ("groundbreaking", "historic", "revolutionary", "amplify", "elevate", "synergize").
  - No corporate speak. No "we are excited to announce." Just announce.
  - No exclamation points unless a person on the team would actually use one.
  - Do not invent dates, names, dollar figures, or events not in the brief or the center facts above.
  - Each post must stand on its own — a reader who saw only that one post should know what the center is asking of them.`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'method not allowed' });
  const auth = requireBasicAuth(event);
  if (!auth.ok) return auth.response;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json(500, { error: 'ANTHROPIC_API_KEY not configured' });

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return json(400, { error: 'invalid json' }); }

  const brief = String(body.brief || '').trim();
  if (brief.length < 5 || brief.length > 2000) {
    return json(400, { error: 'brief must be 5-2000 characters' });
  }
  const audience = String(body.audience || '').trim().slice(0, 200);
  const cta = String(body.cta || '').trim().slice(0, 200);
  let tone = String(body.tone || 'announcement').trim().toLowerCase();
  if (!VALID_TONES.has(tone)) tone = 'announcement';

  let platforms = Array.isArray(body.platforms)
    ? body.platforms.map(p => String(p).toLowerCase()).filter(p => VALID_PLATFORMS.includes(p))
    : VALID_PLATFORMS.slice();
  if (!platforms.length) platforms = VALID_PLATFORMS.slice();

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: buildAyannaSystemPrompt(audience, cta, tone, platforms),
      messages: [{ role: 'user', content: brief }],
    });

    const raw = (response.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();

    let parsed;
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : raw);
    } catch (err) {
      console.error('[sm-generate] JSON parse failed', err && err.message, 'raw:', raw.slice(0, 400));
      return json(502, { error: 'parse failed', detail: raw.slice(0, 400) });
    }

    // Validate, scrub, count characters, enforce platform limits.
    const posts = {};
    for (const platform of platforms) {
      const p = (parsed.posts && parsed.posts[platform]) || {};
      const copy = scrub(p.copy || '').trim();
      const hashtags = Array.isArray(p.hashtags)
        ? p.hashtags.map(t => String(t).toLowerCase().replace(/^#/, '').replace(/[^a-z0-9_]/g, '').slice(0, 40)).filter(Boolean).slice(0, 10)
        : [];
      // For X, the hashtags are part of the post body so the character count
      // includes them. For others, hashtags are shown separately so they're
      // not part of the main copy length.
      let fullText = copy;
      if (platform === 'x' && hashtags.length) {
        const tagStr = hashtags.map(t => '#' + t).join(' ');
        if (!copy.includes('#')) fullText = copy + ' ' + tagStr;
      }
      const overLimit = fullText.length > PLATFORM_LIMITS[platform];
      posts[platform] = {
        copy: fullText,
        hashtags,
        character_count: fullText.length,
        limit: PLATFORM_LIMITS[platform],
        over_limit: overLimit,
      };
      if (overLimit) {
        console.warn('[sm-generate]', platform, 'over limit:', fullText.length, '/', PLATFORM_LIMITS[platform]);
      }
    }

    return json(200, {
      ok: true,
      author: 'Ayanna Cole',
      tone,
      audience: audience || null,
      cta: cta || null,
      posts,
    });
  } catch (err) {
    console.error('[sm-generate] anthropic error', err && err.message);
    return json(502, { error: 'generation failed', detail: err && err.message });
  }
};
