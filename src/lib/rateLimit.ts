const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX) || 10;
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // Sweep stale entries every 5 minutes

const ipMap = new Map<string, { start: number; count: number }>();

// Periodically evict expired entries to prevent unbounded memory growth.
// On a long-running server, IPs that never return would accumulate forever
// without this sweep.
let lastSweep = Date.now();

function sweepStaleEntries(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;

  for (const [ip, record] of ipMap) {
    if (now - record.start > WINDOW_MS) {
      ipMap.delete(ip);
    }
  }
}

export function rateLimit(ip: string) {
  const now = Date.now();
  sweepStaleEntries(now);

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
