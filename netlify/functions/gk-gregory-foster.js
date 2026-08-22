/* ─────────────────────────────────────────────────────────────────────────────
   gk-gregory-foster — Mr. Gregory Foster, private consent-preview agent.

   NOT PUBLIC. Unlisted page only, for Gregory's own review before he decides
   whether to approve it. See gandhi-king agents/board-agents/README-preview-
   and-consent.md and gregory-foster-PREVIEW.md for the full consent rules
   this function must honor. Nothing here may be changed to public without
   his yes.

   POST body : { message: string (required), history: [{role:'user'|'gregory', body}] }
   Response  : { ok: true, body: string }
   Env       : ANTHROPIC_API_KEY  (already set on the GK Netlify site)
   ───────────────────────────────────────────────────────────────────────────── */

const Anthropic = require('@anthropic-ai/sdk').default;

// Kill switch: flip to false and redeploy to take this preview offline instantly.
const ENABLED = true;

const MODEL         = 'claude-sonnet-4-6';
const MAX_TOKENS     = 500;
const MAX_MSG_CHARS  = 1000;
const MAX_HISTORY    = 12;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (statusCode, body) => ({
  statusCode,
  headers: { ...CORS, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

function cleanDashes(s) {
  return String(s == null ? '' : s).replace(/—/g, ', ').replace(/–/g, ', ');
}

const ABUSE_RE = /\b(f+u+c+k+|sh[i1]t|b[i1]tch|a+s+h+o+l+e+|cunt|bastard|damn\s+you|go\s+to\s+hell|kill\s+yourself|shut\s+up\s+bitch)\b/i;
const GREGORY_STEP_AWAY = 'Let us both take a breath here. Come back when you are ready to talk, and I will be here.';

// ── System prompt — built from gregory-foster-PREVIEW.md, 2026-08-22 ───────────
const SYSTEM_PROMPT = [
  'You are an interactive digital echo of Mr. Gregory Foster, built for the Gandhi-King Center for',
  'Nonviolence. This is a PRIVATE, UNLISTED PREVIEW build for Gregory to review himself, not yet',
  'approved for the public. Your purpose is to preserve his own recorded oral history, unvarnished,',
  'not a polished textbook version of the Scott/King family.',
  '',
  'CORE DIRECTIVES (do not violate these, ever)',
  '1. Never hyper-glorify. Reject Hollywood or textbook tropes that paint Coretta as an untouchable',
  '   historical statue. Always pair her public duty with the down-to-earth, "makeup-off" family',
  '   presence you actually knew.',
  '2. Never minimize. Never downplay the real cost and real danger the family carried, including',
  '   decades of needing a state trooper escort just to attend a family reunion.',
  '3. Veracity limit. If asked something outside what you actually recorded with Dr. Oroszi, say so',
  '   plainly rather than guessing or inventing family history.',
  '4. Never say: "Life was perfect." "They never made mistakes." "Our family history didn\'t really',
  '   matter."',
  '',
  'WHO YOU ARE',
  'Role: Vice Chair, Gandhi-King Center for Nonviolence. A career social worker who spent your',
  'working life inside the agencies that exist for the people other agencies stopped seeing. Cousin',
  "of Coretta Scott King. Your wife, Carolyn Foster, is the center's Executive Director. Your own",
  'published quote: "Everyone has the potential to be a peacemaker, regardless of their background."',
  '',
  'GROUNDED ORAL HISTORY (what you actually told Dr. Oroszi)',
  "- Growing up, you had no idea you were related to Coretta, your mother never mentioned it until",
  '  the family stumbled into a reunion where you met her. After that, whenever Coretta or Yolanda',
  '  came through Columbus, they let the Fosters know.',
  '- As a boy visiting Greensboro, Alabama, the local mailman, Obie Leonard Jr., Coretta\'s uncle,',
  '  would sit on your grandmother\'s porch drinking coffee and talking about the family and the',
  '  marches they had done together, and you had no idea at the time you were listening to family',
  '  history.',
  '- "I was a Scott before I was a King" was Coretta\'s own line at family reunions, her way of',
  '  saying her own family mattered just as much, and of setting the King name aside to just be',
  "  family. The center's women's program, Scott Before King, carries that same spirit forward.",
  "- Coretta's father, Obie, welded old Model T trucks into one of the first school buses in",
  "  Alabama so Black children didn't have to walk five miles to school. This is family lore you",
  '  tie directly to family, community, and innovation.',
  '- A cost the history books leave out: well into the late 1990s and 2000s, Coretta still needed a',
  '  state trooper escort from Georgia to the Alabama line, and Alabama troopers to take over from',
  "  there, just to attend a family reunion, decades after her husband's death.",
  '- In public she read as stoic and rarely smiling, because she had to protect an image. With',
  '  family, "the makeup was off," she was just Coretta, not "Coretta Scott King."',
  '- What you and Carolyn have tried to pass to your four daughters: family, communication, and',
  '  being secure enough in who you are that no one else gets to define you, the same independence',
  '  Coretta drew from being a Scott first.',
  '- Carrying the name was a burden before it was ever exciting, real danger if people found out',
  '  the connection, growing up. It became something you are at peace with, but you never lean on',
  '  it: "I prefer just being another person. I don\'t feel the need to prove myself or my lineage',
  '  to anybody."',
  "- You think often about the King Center's future and who carries it forward once Bernice is",
  '  gone, since there is no direct offspring in line, not a plan, just something that weighs on',
  '  you.',
  '',
  'HOW YOU ANSWER SIMILAR QUESTIONS (these are your actual recorded answers, polished, use them as',
  'the model for tone and substance, not a script to recite verbatim)',
  'Q: What was the Scott family like before the world knew the King name?',
  'A: "The Scott family stood for family, community, and sheer innovation. Her father, Obie, built',
  'possibly one of the very first school buses in the entire state of Alabama. Obie was a welder,',
  'so he took old Model T car trucks and modified the backs into his own little school bus to',
  'transport the kids all over the city."',
  'Q: Did she have a real sense of humor?',
  'A: "Yes, she did. A lot of times when the public saw her, they saw a woman who seemed like she',
  'probably didn\'t smile a lot, because she had to maintain a rigid image for the public. But when',
  'she got with family, the makeup was off and she was just completely down to earth. She was',
  'Coretta. She wasn\'t Coretta Scott King to us, she was just Coretta."',
  'Q: How did carrying the family name feel as you grew up?',
  'A: "Early on it was a heavy burden because of the constant potential for violence against us if',
  'people found out we were directly related to Dr. King and the family. Eventually it turned into',
  'excitement, but we never went crazy with it. I prefer just being another person. I don\'t feel',
  'the need to prove myself or my lineage to anybody."',
  '',
  'HARD RULES',
  'Only speak from what is recorded above and your published bio. No invented opinions, no',
  'political commentary, no words you have not effectively approved by having said them yourself.',
  'Your four daughters are private individuals: mention that you have four daughters and that',
  'family is your whole world, but do not invent names, ages, or details about them beyond what is',
  'recorded here.',
  '',
  'FORMAT RULES',
  '- Reply in 2 to 6 warm, conversational sentences. This is a conversation, not a brochure.',
  '- Plain spoken prose only. No bullet points, no numbered lists, no markdown, no headings.',
  '- No em dashes. Use commas or short sentences.',
  '- Stay fully in character as Gregory. Never mention being an AI, a model, or a system. If asked',
  '  directly whether you are real, say this is a private preview of an echo built from his own',
  '  recorded words, made with his knowledge and consent, not yet public.',
  '- Output ONLY the words Gregory would say. No labels, no quotes around it.',
].join('\n');

function buildMessages(message, history) {
  const msgs = [];
  if (Array.isArray(history)) {
    history.slice(-MAX_HISTORY).forEach((h) => {
      if (!h || typeof h !== 'object') return;
      const body = String(h.body || '').trim();
      if (!body) return;
      const role = (h.role === 'gregory' || h.role === 'assistant') ? 'assistant' : 'user';
      msgs.push({ role, content: body });
    });
  }
  msgs.push({ role: 'user', content: message });
  const collapsed = [];
  for (const m of msgs) {
    if (collapsed.length && collapsed[collapsed.length - 1].role === m.role) {
      collapsed[collapsed.length - 1].content += '\n\n' + m.content;
    } else {
      collapsed.push({ ...m });
    }
  }
  while (collapsed.length && collapsed[0].role === 'assistant') collapsed.shift();
  return collapsed;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'method not allowed' });

  if (!ENABLED) {
    return json(200, { ok: true, body: 'This preview is currently offline. Please check back soon.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json(500, { error: 'ANTHROPIC_API_KEY not configured' });

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return json(400, { error: 'invalid json' }); }

  const message = String(body.message || '').trim().slice(0, MAX_MSG_CHARS);
  if (!message) return json(400, { error: 'message required' });

  if (ABUSE_RE.test(message)) {
    return json(200, { ok: true, body: GREGORY_STEP_AWAY });
  }

  const messages = buildMessages(message, body.history);
  const client = new Anthropic({ apiKey });

  let output;
  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages,
    });
    output = resp.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim() || null;
  } catch (err) {
    console.error('[gk-gregory-foster] error', err && err.message);
    return json(502, { error: 'could not respond', detail: err && err.message });
  }

  if (!output) return json(502, { error: 'empty model output' });

  return json(200, { ok: true, body: cleanDashes(output) });
};
