/* ─────────────────────────────────────────────────────────────────────────────
   gk-gregory-foster-voice — ElevenLabs text-to-speech for Mr. Gregory Foster.

   POST { text: string }  ->  audio/mpeg (Gregory speaking the text)

   Voice ID captured 2026-08-22 with Gregory's own recorded consent, per
   voice-capture-kit.md. Fixed here so the client can never inject a
   different voice. Text is capped so this cannot be abused as a general
   TTS proxy.

   Repeated identical text (a canned line like the graceful-disengagement message,
   or any answer that happens to repeat) is cached in Netlify Blobs keyed by a
   hash of the exact text. First time: one ElevenLabs call. Every time after:
   served from the cache, free. Per Dr. Oroszi: canned responses should only
   cost once.

   Env: ELEVENLABS_API_KEY  (already set on the GK Netlify site)
   ───────────────────────────────────────────────────────────────────────────── */

const crypto = require('crypto');
const { getStore, connectLambda } = require('@netlify/blobs');

const VOICE_ID = 'HJw10OoM7RieWRX4efTj';
const MODEL_ID = 'eleven_multilingual_v2';
const CACHE_STORE = 'gk-voice-cache-gregory-foster';

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

function audioResponse(buf, cacheStatus) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(buf.length),
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'X-Voice-Cache': cacheStatus,
    },
    body: buf.toString('base64'),
    isBase64Encoded: true,
  };
}

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

  text = '. ' + text;

  try { connectLambda(event); } catch (_) {}
  const cacheKey = crypto.createHash('sha256').update(text).digest('hex');
  const store = getStore(CACHE_STORE);

  try {
    const cached = await store.get(cacheKey, { type: 'arrayBuffer' });
    if (cached) return audioResponse(Buffer.from(cached), 'hit');
  } catch (err) {
    console.error('[gk-gregory-foster-voice] cache read failed', err && err.message);
    // Fall through to a live call — a cache miss must never break the voice.
  }

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
    console.error('[gk-gregory-foster-voice] fetch failure', err);
    return jsonError(502, 'tts network failure');
  }

  if (!resp.ok) {
    const detail = await safeRead(resp);
    console.error('[gk-gregory-foster-voice] tts non-200', resp.status, detail);
    return jsonError(502, `tts upstream ${resp.status}`);
  }

  const buf = Buffer.from(await resp.arrayBuffer());

  try {
    await store.set(cacheKey, buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  } catch (err) {
    console.error('[gk-gregory-foster-voice] cache write failed', err && err.message);
    // Non-fatal — the visitor still gets their audio, it just won't be cached.
  }

  return audioResponse(buf, 'miss');
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
