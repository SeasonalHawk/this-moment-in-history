const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX) || 10;
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
const ipMap = new Map<string, { start: number; count: number }>();

export function rateLimit(ip: string) {
  const now = Date.now();
  const record = ipMap.get(ip);

  if (!record || now - record.start > WINDOW_MS) {
    ipMap.set(ip, { start: now, count: 1 });
    return { allowed: true };
  }

  record.count += 1;
  if (record.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.start + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

export function clearRateLimits() {
  ipMap.clear();
}
