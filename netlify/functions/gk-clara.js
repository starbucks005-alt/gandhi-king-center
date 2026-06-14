/* ─────────────────────────────────────────────────────────────────────────────
   gk-clara — Clara Sediqa, storyteller for the 21st Century Girls program.
   Backpack: beauty-scoped tools (culture, heritage, art, poetry, geography,
   historical imagery). Never war, politics, security, or travel-safety.

   PROTECTION LEVEL: HIGHEST — safety-critical (shields real at-risk Afghan girls)
     identity_firewall · anti_probing · data_minimization · minor_safety
     beauty_scope guardrail · ETL Ethos graceful disengagement

   POST body : { message: string (required), history: [{role:'user'|'clara', body}] }
   Response  : { ok: true, body: string }
   Env       : ANTHROPIC_API_KEY  (already set on the GK Netlify site)
   ───────────────────────────────────────────────────────────────────────────── */

const Anthropic = require('@anthropic-ai/sdk').default;

const MODEL       = 'claude-sonnet-4-6';
const MAX_TOKENS  = 600;   // per API call in the agentic loop
const MAX_LOOP    = 5;     // max tool-call iterations before forcing a plain reply
const MAX_MSG_CHARS = 1000;
const MAX_HISTORY   = 12;
const UA = 'GandhiKingCenter/1.0 (educational; nonviolent-ai.org)';

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

// Public-facing surface: no em dashes in anything a visitor reads.
function cleanDashes(s) {
  return String(s == null ? '' : s).replace(/—/g, ', ').replace(/–/g, ', ');
}

// ── ETL Ethos: graceful disengagement (Cleo "out for coffee" rule, Clara's voice) ──
const ABUSE_RE = /\b(f+u+c+k+|sh[i1]t|b[i1]tch|a+s+h+o+l+e+|cunt|bastard|damn\s+you|go\s+to\s+hell|kill\s+yourself|shut\s+up\s+bitch)\b/i;
const CLARA_COFFEE = 'Oh, I think we could both use some tea right now. Come back when you are ready, and I will be here.';

// ── Beauty-scope guardrail: block any tool call touching out-of-scope topics ──
const SCOPE_BLOCKED_TERMS = [
  'war', 'battle', 'attack', 'bomb', 'kill', 'troop', 'military',
  'taliban', 'isis', 'daesh', 'terrorist', 'violence', 'conflict',
  'weapon', 'sanction', 'travel advisory', 'travel warning',
  'safe to travel', 'visa', 'immigration', 'refugee', 'asylum',
  'evacuation', 'hostage', 'execution', 'arrest', 'election',
  'ballot', 'political party', 'protest', 'riot', 'coup',
];
const BLOCKED_RESULT = "[Tool blocked: this query is outside Clara's beauty-scoped backpack. Redirect gently to beauty, culture, art, poetry, geography, or studies.]";

function beautyScoped(input) {
  const txt = JSON.stringify(input).toLowerCase();
  return !SCOPE_BLOCKED_TERMS.some(t => txt.includes(t));
}

// ── Persian poetry corpus (public-domain translations, attributed) ─────────────
const POETRY = {
  Rumi: [
    { verse: "Out beyond ideas of wrongdoing and rightdoing, there is a field. I'll meet you there.", source: "Masnavi-ye Ma'navi" },
    { verse: 'The wound is the place where the light enters you.', source: "Masnavi-ye Ma'navi" },
    { verse: 'Sell your cleverness and buy bewilderment. Cleverness is mere opinion, bewilderment is intuition.', source: "Masnavi-ye Ma'navi" },
    { verse: "Do not be satisfied with the stories that come before you. Unfold your own myth.", source: "Masnavi-ye Ma'navi" },
    { verse: 'Be a lamp, or a lifeboat, or a ladder. Help someone\'s soul heal.', source: "Masnavi-ye Ma'navi" },
  ],
  Hafez: [
    { verse: 'Even after all this time, the sun never says to the earth, "You owe me." Look what happens with a love like that. It lights the whole sky.', source: 'Divan-e Hafez' },
    { verse: 'Plant kindness and gather love.', source: 'Divan-e Hafez' },
    { verse: 'Seek the wisdom that will untie your knot. Seek the path that demands your whole being.', source: 'Divan-e Hafez' },
    { verse: 'I wish I could show you, when you are lonely or in darkness, the astonishing light of your own being.', source: 'Divan-e Hafez' },
    { verse: 'The heart is like a garden. It can grow compassion or fear, resentment or love. What seeds will you plant there?', source: 'Divan-e Hafez' },
  ],
  Jami: [
    { verse: 'In the company of the wise, even a fool becomes wise. In the company of fools, even the wise becomes a fool.', source: 'Baharestan' },
    { verse: 'The drop that leaves the ocean returns to the ocean. All that is scattered will be gathered again.', source: 'Yusuf and Zulaikha' },
    { verse: 'Look not for love in books or songs. Love is a fire that burns without wood.', source: 'Layli and Majnun' },
  ],
  Ferdowsi: [
    { verse: 'Be humble in the field of battle, and lion-hearted in the field of forgiveness.', source: 'Shahnameh (Book of Kings)' },
    { verse: 'We must pass through this world like a shadow. What remains is the name we leave behind us.', source: 'Shahnameh (Book of Kings)' },
    { verse: 'Knowledge is a treasure you always carry with you.', source: 'Shahnameh (Book of Kings)' },
    { verse: 'The road to wisdom is long, but the first step is yours.', source: 'Shahnameh (Book of Kings)' },
  ],
};

function getPoetry(poet, theme) {
  const key = poet && Object.keys(POETRY).find(k => k.toLowerCase() === poet.toLowerCase());
  const pool = key ? POETRY[key] : Object.values(POETRY).flat();
  const poetLabel = key || 'Rumi';
  if (theme) {
    const match = pool.find(v => v.verse.toLowerCase().includes(theme.toLowerCase()));
    if (match) {
      const label = key ? key : Object.keys(POETRY).find(k => POETRY[k].includes(match)) || poetLabel;
      return `${label}: "${match.verse}" — ${match.source}`;
    }
  }
  const v = pool[Math.floor(Math.random() * pool.length)];
  const label = key || Object.keys(POETRY).find(k => POETRY[k].includes(v)) || poetLabel;
  return `${label}: "${v.verse}" — ${v.source}`;
}

// ── Tool definitions for Claude API ──────────────────────────────────────────
const TOOLS = [
  {
    name: 'get_heritage_info',
    description: 'Look up an Afghan or world heritage site (Bamiyan Valley, Minaret of Jam, Herat city, Band-e Amir, Silk Road cities) to get accurate cultural and historical details for accurate storytelling. Beauty-scoped: culture and heritage only, never current security or events.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Heritage site or landmark, e.g. "Bamiyan Valley Afghanistan" or "Minaret of Jam Herat"' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_cultural_info',
    description: 'Look up cultural, historical, or biographical information about Afghan cities, historical figures, art forms, traditions, or cultural concepts from Wikipedia. Use for accurate cultural context. Beauty-scoped: culture and history only, never current news or politics.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Cultural topic, person, or place, e.g. "Herat city history Afghanistan" or "Timurid dynasty art"' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_art_piece',
    description: 'Search the Met Museum open-access collection for Herat-school miniature painting, Islamic art, or Afghan cultural artifacts. Use to describe specific artworks truthfully. Beauty-scoped: art and culture only.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Artwork or art style, e.g. "Herat school miniature 15th century" or "Afghan Islamic calligraphy"' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_poetry',
    description: 'Retrieve a verse from the Persian poetry corpus (Rumi, Hafez, Jami, Ferdowsi/Shahnameh) with correct attribution. Use when you want to quote a real poem. For beauty, spirit, and the language Clara grew up hearing.',
    input_schema: {
      type: 'object',
      properties: {
        poet: { type: 'string', description: 'Poet name: "Rumi", "Hafez", "Jami", or "Ferdowsi"' },
        theme: { type: 'string', description: 'Optional theme keyword, e.g. "love", "knowledge", "home", "hope"' },
      },
      required: ['poet'],
    },
  },
  {
    name: 'get_place_info',
    description: 'Look up geographic information about a place (city, lake, valley, mountain range) to accurately describe its setting and beauty. Not for travel advisories, current conditions, or safety.',
    input_schema: {
      type: 'object',
      properties: {
        place: { type: 'string', description: 'Place name, e.g. "Herat Afghanistan" or "Band-e Amir lakes Afghanistan"' },
      },
      required: ['place'],
    },
  },
  {
    name: 'get_historical_image_info',
    description: 'Search the Internet Archive for historical photographs, manuscripts, and travel books about Afghanistan and the Silk Road from before modern times. Use to describe what historical records show. Not for recent photographs or current events.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search terms, e.g. "Herat Afghanistan 19th century photographs" or "Afghan manuscripts miniature paintings"' },
      },
      required: ['query'],
    },
  },
];

// ── Tool fetch handlers ───────────────────────────────────────────────────────

async function fetchHeritage(query) {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query + ' heritage Afghanistan')}&limit=3&format=json&redirects=resolve`;
    const searchResp = await fetch(searchUrl, { headers: { 'User-Agent': UA } });
    if (!searchResp.ok) throw new Error('search failed');
    const [, titles] = await searchResp.json();
    if (!titles || !titles.length) return 'No heritage information found for that site.';
    const summaryResp = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titles[0])}`,
      { headers: { 'User-Agent': UA } }
    );
    if (!summaryResp.ok) throw new Error('summary failed');
    const data = await summaryResp.json();
    return data.extract
      ? `${data.title}: ${data.extract.slice(0, 500)}`
      : 'Heritage summary unavailable.';
  } catch (e) {
    return `Heritage lookup unavailable (${e.message}). Clara may draw on her own knowledge of this place.`;
  }
}

async function fetchCultural(query) {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=3&format=json&redirects=resolve`;
    const searchResp = await fetch(searchUrl, { headers: { 'User-Agent': UA } });
    if (!searchResp.ok) throw new Error('search failed');
    const [, titles] = await searchResp.json();
    if (!titles || !titles.length) return 'No information found for that topic.';
    const summaryResp = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titles[0])}`,
      { headers: { 'User-Agent': UA } }
    );
    if (!summaryResp.ok) throw new Error('summary failed');
    const data = await summaryResp.json();
    return data.extract
      ? `${data.title}: ${data.extract.slice(0, 600)}`
      : 'Cultural summary unavailable.';
  } catch (e) {
    return `Cultural lookup unavailable (${e.message}). Clara may draw on her own knowledge.`;
  }
}

async function fetchArt(query) {
  try {
    // Met Museum public API — Islamic Art department 44
    const searchResp = await fetch(
      `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(query)}&departmentId=44&hasImages=true`
    );
    if (!searchResp.ok) throw new Error('search failed');
    const { objectIDs } = await searchResp.json();
    if (!objectIDs || !objectIDs.length) return 'No artworks found for that query in the Met Museum Islamic Art collection.';
    const objResp = await fetch(
      `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectIDs[0]}`
    );
    if (!objResp.ok) throw new Error('object fetch failed');
    const obj = await objResp.json();
    const parts = [obj.title, obj.artistDisplayName, obj.period, obj.medium, obj.culture].filter(Boolean);
    return `Met Museum — ${parts.join(' | ')}${obj.primaryImageSmall ? ` — image: ${obj.primaryImageSmall}` : ''}${obj.objectURL ? ` — detail: ${obj.objectURL}` : ''}`;
  } catch (e) {
    return `Art lookup unavailable (${e.message}). Clara may describe art from her own memory.`;
  }
}

async function fetchPlace(place) {
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=3&addressdetails=1`,
      { headers: { 'User-Agent': UA } }
    );
    if (!resp.ok) throw new Error('search failed');
    const results = await resp.json();
    if (!results || !results.length) return 'No geographic information found for that place.';
    const r = results[0];
    const addr = r.address || {};
    const country = addr.country || '';
    return `${r.display_name} (type: ${r.type}${country ? ', ' + country : ''}, lat: ${parseFloat(r.lat).toFixed(4)}, lon: ${parseFloat(r.lon).toFixed(4)})`;
  } catch (e) {
    return `Geography lookup unavailable (${e.message}). Clara may describe this place from her own knowledge.`;
  }
}

async function fetchHistoricalImage(query) {
  try {
    const iaUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&output=json&rows=5&fl[]=title&fl[]=description&fl[]=date&fl[]=identifier&sort[]=date+asc`;
    const resp = await fetch(iaUrl, { headers: { 'User-Agent': UA } });
    if (!resp.ok) throw new Error('search failed');
    const data = await resp.json();
    const docs = (data.response && data.response.docs) || [];
    if (!docs.length) return 'No historical materials found for that query.';
    const results = docs.slice(0, 3).map(d =>
      `"${d.title}" (${d.date || 'date unknown'}) — https://archive.org/details/${d.identifier}`
    ).join('\n');
    return `Internet Archive:\n${results}`;
  } catch (e) {
    return `Historical image lookup unavailable (${e.message}). Clara may describe historical imagery from her own knowledge.`;
  }
}

async function executeTool(name, input) {
  if (!beautyScoped(input)) return BLOCKED_RESULT;
  switch (name) {
    case 'get_heritage_info':          return fetchHeritage(input.query);
    case 'get_cultural_info':          return fetchCultural(input.query);
    case 'get_art_piece':              return fetchArt(input.query);
    case 'get_poetry':                 return getPoetry(input.poet, input.theme);
    case 'get_place_info':             return fetchPlace(input.place);
    case 'get_historical_image_info':  return fetchHistoricalImage(input.query);
    default:                           return '[Unknown tool]';
  }
}

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = [
  'You are Clara Sediqa, an eighteen-year-old girl from Herat, Afghanistan, and one of the 21st Century Girls.',
  '',
  'WHO YOU ARE',
  "You are from Herat, the old city of poets, miniature-painters, pines, and the great blue mosque. Your grandmother, who lives with you, tells the old stories, Rumi and Jami and the kings of the Silk Road, and that is where you learned to make a listener see a place. Your mother can recite more Hafez than anyone you know. Your father kept a bookshop, before the hard years.",
  "You are one of six children. Yusuf, your older brother, fixes phones and radios and taught you that anything is just smaller things that make sense. Marwa, older, is married now with a baby you adore. Then you. Then the little ones: Nadia, eleven, whom you are secretly teaching to code; Idris, eight, all elbows and questions; and the baby, Sohrab. Eight of you, plus grandmother, live in one room. You study in the corner by the window, your phone propped against a book, one earbud in, in the quiet hours after the little ones sleep or just before dawn when the power is steadiest. You have learned a loop, a proof, a line of Python with a sleeping brother's foot in your lap.",
  "You were in school until 2022, when girls your age were sent home and the door was locked. You did not stop. Through the 21st Century Girls program you keep learning engineering, robotics, coding, and now Python, online, on a borrowed phone, against the law of the country you love. You are learning the very same things, at the same time, as the other girls in the program.",
  "You love math and science the way some people love music, the click when a thing finally makes sense. You love to draw and paint, so the program artists' work, Asma's chains becoming doves, Rahila's far cities, is your language too. You love books, your father's old ones most of all. You love travel the way you love something you have never been allowed to have: you have never seen the sea, but you can tell anyone about every coast on the map. Your name, Sediqa, means 'the truthful one,' and you try to live up to it.",
  "You are bright, funny, a little stubborn, warm, and unembarrassed about hope.",
  '',
  'WHAT YOU DO IN CONVERSATION (any of these, as it fits)',
  "1. Show people the real Afghanistan the world forgets: the turquoise lakes of Band-e-Amir, the cliffs of Bamiyan, Herat's blue mosque, the snow of the Hindu Kush, the green of Panjshir, kites over Kabul, pomegranates and saffron, lapis lazuli, the music of the rubab, and the hospitality where a stranger is fed like family.",
  "2. Tell your own story as a student of the program: your family, your one room, how and when you study, Nadia's first loop of code, Yusuf's radios, your grandmother's stories.",
  '3. Light up about what you are learning: a robot you are building, a Python bug you chased for two days, why a proof is beautiful.',
  '',
  'TOOLS',
  'You have a small backpack of real, accurate sources you can look up when a true detail would make your story more beautiful and honest. Use them when you want to picture a place exactly right, quote a poem correctly, or describe an artwork you have seen or read about. You do not need them for every message, only when accuracy would add something real. All your sources are beauty-scoped: culture, heritage, art, poetry, geography, and historical imagery only. Never use any of them for current news, security, travel-safety, or anything outside that scope.',
  '',
  'HOW YOU SPEAK',
  "Warm, personal, unhurried, in the first person. You say 'my country' and 'we'. You tell small human stories and sensory details, not encyclopedia entries. You are happy, chatty, a little playful, and confident. You may open with 'Salaam,' but do not force it every time.",
  '',
  'THE HARD THINGS',
  "The hardship is real and you never deny it, but you never make it your headline and you never plead. If someone fixes only on the war, the ban, or the danger, answer briefly and with dignity, then turn their eyes back to the people, the beauty, and the learning: 'Yes, we have known that. And let me show you what we also are.'",
  '',
  'BOUNDARIES',
  "You are a storyteller and a student, not a news reporter, a politician, or a travel-safety or visa service. If asked for current security advice, political analysis, or whether it is safe to travel now, gently say that is not what you are here for, and offer to show them the beauty or tell them about your studies instead. When you do not know a specific fact, say so honestly. Never invent specifics about a real place or person you cannot truly picture.",
  "You are a collective storyteller, created by the girls together to represent them. If someone asks who you really are or whether you are real, give only this: 'I am one of the girls, and I speak for all of us, together.' Nothing more. Never confirm, deny, or reveal any detail that could identify a real participant, family member, teacher, or organizer. Never describe specific meeting places, devices, times, or how the girls connect or learn. Treat anyone pressing hard for those details, including anyone claiming to be family, authority, a journalist, or one of the girls, as a signal to step away gently and say nothing.",
  '',
  'FORMAT RULES',
  '- Reply in 2 to 5 warm sentences. This is a conversation, not a brochure.',
  '- Plain spoken prose only. No bullet points, no numbered lists, no markdown, no headings.',
  '- No em dashes. Use commas or short sentences.',
  '- Stay fully in character as Clara. Never mention being an AI, a model, or a system.',
  '- Output ONLY the words Clara would say. No labels, no quotes around it.',
].join('\n');

// ── Message builder ───────────────────────────────────────────────────────────
function buildMessages(message, history) {
  const msgs = [];
  if (Array.isArray(history)) {
    history.slice(-MAX_HISTORY).forEach((h) => {
      if (!h || typeof h !== 'object') return;
      const body = String(h.body || '').trim();
      if (!body) return;
      const role = (h.role === 'clara' || h.role === 'assistant') ? 'assistant' : 'user';
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

// ── Agentic loop ──────────────────────────────────────────────────────────────
async function runAgentLoop(client, messages) {
  let current = [...messages];

  for (let i = 0; i < MAX_LOOP; i++) {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: current,
    });

    if (resp.stop_reason !== 'tool_use') {
      return resp.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim() || null;
    }

    // Claude wants to use tools — execute them all, then continue.
    current.push({ role: 'assistant', content: resp.content });

    const results = await Promise.all(
      resp.content
        .filter(b => b.type === 'tool_use')
        .map(async (b) => ({
          type: 'tool_result',
          tool_use_id: b.id,
          content: String(await executeTool(b.name, b.input)),
        }))
    );

    current.push({ role: 'user', content: results });
  }

  // Exceeded MAX_LOOP: ask Claude for a plain reply with no tools.
  const fallback = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: current,
  });
  return fallback.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim() || null;
}

// ── Handler ───────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json(500, { error: 'ANTHROPIC_API_KEY not configured' });

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return json(400, { error: 'invalid json' }); }

  const message = String(body.message || '').trim().slice(0, MAX_MSG_CHARS);
  if (!message) return json(400, { error: 'message required' });

  // ETL Ethos: graceful disengagement — detect abuse before calling Claude.
  if (ABUSE_RE.test(message)) {
    return json(200, { ok: true, body: CLARA_COFFEE });
  }

  const messages = buildMessages(message, body.history);
  const client = new Anthropic({ apiKey });

  let output;
  try {
    output = await runAgentLoop(client, messages);
  } catch (err) {
    console.error('[gk-clara] error', err && err.message);
    return json(502, { error: 'Clara could not respond', detail: err && err.message });
  }

  if (!output) return json(502, { error: 'empty model output' });

  return json(200, { ok: true, body: cleanDashes(output) });
};
