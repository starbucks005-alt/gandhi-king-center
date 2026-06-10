/* ─────────────────────────────────────────────────────────────────────────────
   gk-clara-voice — ElevenLabs text-to-speech for Clara Sediqa.

   POST { text: string }  ->  audio/mpeg (Clara speaking the text)

   The client (clara.html) sends Clara's chat reply here and plays the MP3 back,
   so she speaks her answers aloud. Clara's ElevenLabs voice_id is fixed in this
   function so the client can never inject a different voice. Text is capped so
   this cannot be abused as a general TTS proxy.

   Env: ELEVENLABS_API_KEY  (already set on the GK Netlify site)
   ───────────────────────────────────────────────────────────────────────────── */

// Clara's custom ElevenLabs voice (designed in Voice Design: young woman,
// warm Persian/Dari accent, outgoing and peaceful).
const VOICE_ID = 'PzjhZZHtjoKOKhQSFlcJ';

// eleven_multilingual_v2 is the current default and what the voice sounds like
// when previewed in the ElevenLabs UI.
const MODEL_ID = 'eleven_multilingual_v2';

// Tuned for warm, less-synthetic delivery.
const VOICE_SETTINGS = {
  stability: 0.40,
  similarity_boost: 0.85,
  style: 0.35,
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
  // and the browser clips Clara's first word. The period is voiced as silence.
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
    console.error('[gk-clara-voice] fetch failure', err);
    return jsonError(502, 'tts network failure');
  }

  if (!resp.ok) {
    const detail = await safeRead(resp);
    console.error('[gk-clara-voice] tts non-200', resp.status, detail);
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
