/**
 * In-memory rate limiter for This Moment in History API
 * Configurable via env vars: RATE_LIMIT_MAX and RATE_LIMIT_WINDOW_MS
 */

const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX) || 10;
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000;

const ipMap = new Map();

function rateLimit(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown';

  const now = Date.now();
  const record = ipMap.get(ip);

  if (!record || now - record.start > WINDOW_MS) {
    ipMap.set(ip, { start: now, count: 1 });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  record.count += 1;

  if (record.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.start + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true, remaining: MAX_REQUESTS - record.count };
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipMap) {
    if (now - record.start > WINDOW_MS) {
      ipMap.delete(ip);
    }
  }
}, 300000).unref();

module.exports = { rateLimit };
