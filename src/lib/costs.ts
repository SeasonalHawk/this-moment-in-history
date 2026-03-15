/**
 * Cost estimation for story generation pipeline.
 *
 * Pricing sources (see README.md lines 209-273):
 *   Claude Haiku 4.5 — https://docs.anthropic.com/en/docs/about-claude/models
 *   ElevenLabs Flash v2.5 — https://elevenlabs.io/pricing
 *
 * These constants should be updated if provider pricing changes.
 */

// Claude Haiku 4.5 pricing (per token)
export const CLAUDE_INPUT_COST_PER_TOKEN = 1.0 / 1_000_000; // $1.00 / 1M tokens
export const CLAUDE_OUTPUT_COST_PER_TOKEN = 5.0 / 1_000_000; // $5.00 / 1M tokens

// ElevenLabs Flash v2.5 pricing (per character, Creator plan ~$0.11/1K chars)
export const ELEVENLABS_COST_PER_CHAR = 0.00011;

export interface CostData {
  inputTokens: number;
  outputTokens: number;
  ttsCharacters: number;
}

/** Calculate total estimated cost in USD for a single story generation. */
export function calculateCost(data: CostData): number {
  const claudeCost =
    data.inputTokens * CLAUDE_INPUT_COST_PER_TOKEN +
    data.outputTokens * CLAUDE_OUTPUT_COST_PER_TOKEN;
  const ttsCost = data.ttsCharacters * ELEVENLABS_COST_PER_CHAR;
  return claudeCost + ttsCost;
}

/** Format a dollar amount for display (e.g. "~$0.12" or "<$0.01"). */
export function formatCost(dollars: number): string {
  if (dollars < 0.01) return '<$0.01';
  return `~$${dollars.toFixed(2)}`;
}
