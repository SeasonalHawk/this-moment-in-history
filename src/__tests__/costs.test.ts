import { describe, it, expect } from 'vitest';
import {
  CLAUDE_INPUT_COST_PER_TOKEN,
  CLAUDE_OUTPUT_COST_PER_TOKEN,
  ELEVENLABS_COST_PER_CHAR,
  calculateCost,
  formatCost,
} from '@/lib/costs';

describe('Cost constants', () => {
  it('Claude input cost is positive', () => {
    expect(CLAUDE_INPUT_COST_PER_TOKEN).toBeGreaterThan(0);
  });

  it('Claude output cost is positive and higher than input', () => {
    expect(CLAUDE_OUTPUT_COST_PER_TOKEN).toBeGreaterThan(0);
    expect(CLAUDE_OUTPUT_COST_PER_TOKEN).toBeGreaterThan(CLAUDE_INPUT_COST_PER_TOKEN);
  });

  it('ElevenLabs cost per char is positive', () => {
    expect(ELEVENLABS_COST_PER_CHAR).toBeGreaterThan(0);
  });

  it('Claude input matches $1.00/1M tokens', () => {
    expect(CLAUDE_INPUT_COST_PER_TOKEN).toBeCloseTo(1.0 / 1_000_000, 10);
  });

  it('Claude output matches $5.00/1M tokens', () => {
    expect(CLAUDE_OUTPUT_COST_PER_TOKEN).toBeCloseTo(5.0 / 1_000_000, 10);
  });
});

describe('calculateCost', () => {
  it('calculates typical story cost (~$0.09-0.15)', () => {
    const cost = calculateCost({
      inputTokens: 700,
      outputTokens: 300,
      ttsCharacters: 1100,
    });
    // Claude: 700 * $0.000001 + 300 * $0.000005 = $0.0007 + $0.0015 = $0.0022
    // TTS:    1100 * $0.00011 = $0.121
    // Total:  ~$0.1232
    expect(cost).toBeGreaterThan(0.09);
    expect(cost).toBeLessThan(0.20);
  });

  it('returns 0 for zero usage', () => {
    const cost = calculateCost({ inputTokens: 0, outputTokens: 0, ttsCharacters: 0 });
    expect(cost).toBe(0);
  });

  it('TTS dominates total cost (>90%)', () => {
    const data = { inputTokens: 700, outputTokens: 300, ttsCharacters: 1100 };
    const total = calculateCost(data);
    const claudeOnly = calculateCost({ ...data, ttsCharacters: 0 });
    expect(claudeOnly / total).toBeLessThan(0.10); // Claude is <10% of total
  });
});

describe('formatCost', () => {
  it('formats normal cost as ~$X.XX', () => {
    expect(formatCost(0.12)).toBe('~$0.12');
  });

  it('formats sub-penny cost as <$0.01', () => {
    expect(formatCost(0.005)).toBe('<$0.01');
  });

  it('formats zero as <$0.01', () => {
    expect(formatCost(0)).toBe('<$0.01');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatCost(0.1234)).toBe('~$0.12');
    expect(formatCost(0.1256)).toBe('~$0.13');
  });
});
