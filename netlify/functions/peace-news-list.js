/* ─────────────────────────────────────────────────────────────────────────────
   peace-news-list — public GET, returns the rolling index of Sneha's
   dispatches as JSON. The /peace-news public list page fetches this on
   load and renders cards.

   GET /.netlify/functions/peace-news-list[?limit=20]

   No auth. Public. Aggressively cached (60s) since dispatches don't change
   second-to-second.
   ───────────────────────────────────────────────────────────────────────────── */

const { connectLambda } = require('@netlify/blobs');
const { readIndex } = require('./_peace-news-helpers');
const { getStore } = require('@netlify/blobs');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'method not allowed' }) };
  }

  try { connectLambda(event); } catch (_) {}

  const qs = event.queryStringParameters || {};
  const limit = Math.max(1, Math.min(200, parseInt(qs.limit, 10) || 50));

  let index = [];
  try {
    index = await readIndex(getStore);
  } catch (err) {
    console.error('[peace-news-list] index read failed', err && err.message);
  }

  return {
    statusCode: 200,
    headers: {
      ...CORS,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=600',
    },
    body: JSON.stringify({
      author: 'Sneha Desai',
      desk: 'Peace News',
      count: index.length,
      dispatches: index.slice(0, limit),
    }),
  };
};
