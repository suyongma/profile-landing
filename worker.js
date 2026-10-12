// Static files in ./public are served directly by Workers Assets (see wrangler.json).
// This script only runs for /api/* (run_worker_first) and for requests with no matching asset.

const SERVICES = {
  stri: 'https://stri.mashong.com/',
  ipip: 'https://ipip.mashong.com/',
  ipc: 'https://ipc.mashong.com/',
  mapt: 'https://mapt.mashong.com/',
  shopping: 'https://shopping.mashong.com/',
  world: 'https://world.mashong.com/',
};

const STATUS_TTL_SECONDS = 60;
const CHECK_TIMEOUT_MS = 5000;

// Returns the HTTP status of the service root, or 0 on network error / timeout.
async function probe(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
      cf: { cacheTtl: 0 },
    });
    return res.status;
  } catch {
    return 0;
  }
}

// 2xx/3xx, or auth walls (401/403), mean the service answered. A 404 at the root
// usually means a Cloudflare routing error (e.g. 1042), so it counts as down.
function isUp(status) {
  return (status >= 200 && status < 400) || status === 401 || status === 403;
}

async function handleStatus(request, ctx) {
  const cache = caches.default;
  const cacheKey = new Request(new URL('/api/status', request.url).toString(), { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const entries = await Promise.all(
    Object.entries(SERVICES).map(async ([id, url]) => [id, await probe(url)])
  );
  const codes = Object.fromEntries(entries);
  const services = Object.fromEntries(entries.map(([id, status]) => [id, isUp(status)]));

  const response = new Response(
    JSON.stringify({ checkedAt: new Date().toISOString(), services, codes }),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': `public, max-age=${STATUS_TTL_SECONDS}`,
        'x-content-type-options': 'nosniff',
      },
    }
  );
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/status') {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
      }
      return handleStatus(request, ctx);
    }

    if (url.pathname.startsWith('/api/')) {
      return new Response('Not Found', { status: 404 });
    }

    // No asset matched: let Workers Assets apply not_found_handling (404.html).
    return env.ASSETS.fetch(request);
  },
};
