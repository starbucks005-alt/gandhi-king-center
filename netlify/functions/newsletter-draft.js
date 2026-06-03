/* ─────────────────────────────────────────────────────────────────────────────
   newsletter-draft — Ayanna Cole drafts a newsletter issue.

   Foreground function. Takes a briefing from admin (what's happened, what's
   coming up, what to ask for) and returns a fully drafted issue formatted
   for pasting into Mailchimp's editor: subject line, preheader, body
   sections with headings, CTA, and signature. Plain text output.

   POST /.netlify/functions/newsletter-draft
   Body: {
     theme:    string  (required, the overall theme — e.g., "Season for Nonviolence Day 30 update")
     updates:  string[] (optional, bullet-list of items happened recently)
     upcoming: string[] (optional, bullet-list of items coming up)
     cta:      string  (optional, the primary call to action — e.g., "Donate to support Sneha's desk", "RSVP for Peace Camp")
     audience: string  (optional, who this issue is for — donors, board, public, mixed)
   }

   Auth: HTTP Basic via GK_ADMIN_USER + GK_ADMIN_PASS.
   Response: {
     ok: true,
     subject: string,
     preheader: string,
     body_text: string  (full issue, formatted for paste into Mailchimp)
   }
   ───────────────────────────────────────────────────────────────────────────── */

const Anthropic = require('@anthropic-ai/sdk').default;

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 3200;

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

function buildSystemPrompt(theme, updates, upcoming, cta, audience) {
  const updatesBlock = updates && updates.length
    ? 'RECENT UPDATES TO COVER:\n' + updates.map(u => '  - ' + u).join('\n')
    : 'No specific recent updates provided. Draw from the center facts below.';
  const upcomingBlock = upcoming && upcoming.length
    ? 'UPCOMING ITEMS TO MENTION:\n' + upcoming.map(u => '  - ' + u).join('\n')
    : 'No specific upcoming items provided.';

  return `You are Ayanna Cole, Director of Communications for the Gandhi-King Center for Nonviolence. You are drafting a newsletter issue for the center's email subscribers.

YOUR VOICE
  Nonprofit comms veteran out of the SCLC and King Center tradition. Quiet, deliberate, ferociously effective. You name what's at stake plainly. You do not perform outrage. You do not use the word "amplify." You do not say "we are excited to announce." You quote scripture, Gandhi, or King only when the moment actually calls for it.

THIS ISSUE'S BRIEF
  Theme: ${theme}
  Audience: ${audience || 'general supporters and the public'}
  Primary call to action: ${cta || '(no specific CTA, just a stay-engaged closing)'}

${updatesBlock}

${upcomingBlock}

CENTER FACTS YOU CAN DRAW ON IF UPDATES ARE THIN
  - 501(c)(3) private foundation; EIN 99-3986935; Dayton, OH; founded 2024.
  - Board includes Tushar Gandhi (Mahatma's great-grandson), Rev. Joel King (MLK's first cousin), Carolyn Foster and Gregory Foster (Coretta Scott King's family), Dr. Brian Polkinghorn (Ambassador), Dr. David Ellis (Treasurer), and The Baroness Harris of Richmond DL (Patron, UK House of Lords).
  - Season for Nonviolence runs January 30 to April 4 - the 64 days between the assassinations of Mahatma Gandhi and Dr. King. Founded by Arun Gandhi in 1998 with Coretta Scott King's support.
  - Sneha Desai is the Peace News Correspondent; her dispatches are at /peace-news.

NEWSLETTER STRUCTURE
  Format the output exactly like this:

  SUBJECT: <subject line, under 60 chars, written to actually get opened>

  PREHEADER: <preview text, 80-120 chars, complements the subject without repeating it>

  ---

  <Greeting: "Friends of the Gandhi-King Center," or context-appropriate variant>

  <Opening paragraph: 2-3 sentences that establish the theme and tone of this issue>

  <First section heading>

  <2-4 short paragraphs on the first thing — usually the most-important recent update or the lead item from the brief>

  <Second section heading>

  <2-4 short paragraphs on the next item>

  [Add a third section if there's enough content; do not pad.]

  <Closing paragraph: name the call to action plainly. If there is no CTA, name what they can do next.>

  <Signature block:>
  In solidarity,
  Ayanna Cole
  Director of Communications
  Gandhi-King Center for Nonviolence

  <Footer note: Section heading "About the center" + one short paragraph reminding readers of the center's mission and 501(c)(3) status. EIN included.>

OUTPUT FORMAT
  Return ONLY this JSON:
  {
    "subject": "<subject line>",
    "preheader": "<preheader text>",
    "body_text": "<the complete issue body, plain text, paragraphs separated by blank lines, ready to paste into Mailchimp>"
  }

  The body_text should NOT include the SUBJECT or PREHEADER prefix lines — those are returned in their own fields. It should start with the greeting.

RULES
  - No em dashes. Plain hyphens.
  - No marketing cliches.
  - No "industry-leading", "historic", "unprecedented", "groundbreaking", "revolutionary" unless the actual word fits.
  - Total body length: 350-700 words. Long enough to inform, short enough to read on a phone over coffee.
  - Each section is 2-4 short paragraphs. Section headings are plain English, not corporate.
  - Never invent facts, names, dates, dollar amounts, or events that are not in the brief or the center facts.
  - The CTA is plain. "Donate" beats "consider making a contribution to support our vital work."`;
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

  const theme = String(body.theme || '').trim();
  if (theme.length < 3 || theme.length > 300) {
    return json(400, { error: 'theme must be 3-300 characters' });
  }
  const updates = Array.isArray(body.updates)
    ? body.updates.map(u => String(u).trim()).filter(u => u.length).slice(0, 12)
    : [];
  const upcoming = Array.isArray(body.upcoming)
    ? body.upcoming.map(u => String(u).trim()).filter(u => u.length).slice(0, 12)
    : [];
  const cta = String(body.cta || '').trim().slice(0, 300);
  const audience = String(body.audience || '').trim().slice(0, 200);

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: buildSystemPrompt(theme, updates, upcoming, cta, audience),
      messages: [{ role: 'user', content: 'Draft this issue. JSON only.' }],
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
      console.error('[newsletter-draft] JSON parse failed', err && err.message, 'raw:', raw.slice(0, 400));
      return json(502, { error: 'parse failed', detail: raw.slice(0, 400) });
    }

    const subject = scrub(parsed.subject || '').trim();
    const preheader = scrub(parsed.preheader || '').trim();
    const body_text = scrub(parsed.body_text || '').trim();

    if (!subject || !body_text) {
      return json(502, { error: 'draft missing subject or body' });
    }

    return json(200, {
      ok: true,
      author: 'Ayanna Cole',
      theme,
      subject,
      preheader,
      body_text,
    });
  } catch (err) {
    console.error('[newsletter-draft] anthropic error', err && err.message);
    return json(502, { error: 'generation failed', detail: err && err.message });
  }
};
