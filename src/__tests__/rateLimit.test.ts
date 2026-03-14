import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimit, clearRateLimits } from '@/lib/rateLimit';

describe('rateLimit', () => {
  beforeEach(() => {
    clearRateLimits();
  });

  it('allows first request', () => {
    const result = rateLimit('127.0.0.1');
    expect(result.allowed).toBe(true);
  });

  it('allows up to 10 requests from same IP', () => {
    for (let i = 0; i < 10; i++) {
      const result = rateLimit('127.0.0.1');
      expect(result.allowed).toBe(true);
    }
  });

  it('blocks 11th request from same IP', () => {
    for (let i = 0; i < 10; i++) {
      rateLimit('127.0.0.1');
    }
    const result = rateLimit('127.0.0.1');
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('tracks different IPs independently', () => {
    for (let i = 0; i < 10; i++) {
      rateLimit('192.168.1.1');
    }
    // First IP is maxed out
    expect(rateLimit('192.168.1.1').allowed).toBe(false);
    // Second IP should still be allowed
    expect(rateLimit('192.168.1.2').allowed).toBe(true);
  });

  it('resets after window expires', () => {
    vi.useFakeTimers();

    for (let i = 0; i < 10; i++) {
      rateLimit('127.0.0.1');
    }
    expect(rateLimit('127.0.0.1').allowed).toBe(false);

    // Advance past the 60s window
    vi.advanceTimersByTime(61000);
    expect(rateLimit('127.0.0.1').allowed).toBe(true);

    vi.useRealTimers();
  });
});
