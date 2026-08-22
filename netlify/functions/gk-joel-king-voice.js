/* ─────────────────────────────────────────────────────────────────────────────
   gk-joel-king-voice — ElevenLabs text-to-speech for Rev. Joel Lawrence King Jr.

   POST { text: string }  ->  audio/mpeg (Joel speaking the text)

   Voice ID captured 2026-08-22 with Joel's own recorded consent, per
   voice-capture-kit.md. Fixed here so the client can never inject a
   different voice. Text is capped so this cannot be abused as a general
   TTS proxy.

   Env: ELEVENLABS_API_KEY  (already set on the GK Netlify site)
   ───────────────────────────────────────────────────────────────────────────── */

const VOICE_ID = 'P31dcm4p9fCpK43qjkKw';
const MODEL_ID = 'eleven_multilingual_v2';

const VOICE_SETTINGS = {
  stability: 0.45,
  similarity_boost: 0.85,
  style: 0.30,
  use_speaker_boost: true,
};

const TEXT_CAP = 1500;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return jsonError(405, 'method not allowed');

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return jsonError(500, 'ELEVENLABS_API_KEY not configured');

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return jsonError(400, 'invalid json'); }

  let text = String(body.text || '').trim();
  if (!text) return jsonError(400, 'text required');
  if (text.length > TEXT_CAP) text = text.slice(0, TEXT_CAP);

  // Leading pause buffer: without ". " up front, ElevenLabs starts mid-phoneme
  // and the browser clips the first word.
  text = '. ' + text;

  let resp;
  try {
    resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS }),
    });
  } catch (err) {
    console.error('[gk-joel-king-voice] fetch failure', err);
    return jsonError(502, 'tts network failure');
  }

  if (!resp.ok) {
    const detail = await safeRead(resp);
    console.error('[gk-joel-king-voice] tts non-200', resp.status, detail);
    return jsonError(502, `tts upstream ${resp.status}`);
  }

  const buf = Buffer.from(await resp.arrayBuffer());
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(buf.length),
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
    body: buf.toString('base64'),
    isBase64Encoded: true,
  };
};

function jsonError(statusCode, message) {
  return {
    statusCode,
    headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: message }),
  };
}

async function safeRead(resp) {
  try { return await resp.text(); } catch { return ''; }
}
