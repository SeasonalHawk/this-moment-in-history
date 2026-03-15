import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Issue #2: Pipeline sends cost data in NDJSON', () => {
  const pipelineSource = fs.readFileSync(
    path.resolve(__dirname, '../app/api/pipeline/route.ts'), 'utf-8'
  );

  it('story event includes inputTokens', () => {
    expect(pipelineSource).toContain('inputTokens: message.usage.input_tokens');
  });

  it('story event includes outputTokens', () => {
    expect(pipelineSource).toContain('outputTokens: message.usage.output_tokens');
  });

  it('audio event includes ttsCharacters', () => {
    expect(pipelineSource).toContain('ttsCharacters: fullText.length');
  });
});

describe('Issue #2: Cost module exports', () => {
  const costsSource = fs.readFileSync(
    path.resolve(__dirname, '../lib/costs.ts'), 'utf-8'
  );

  it('exports calculateCost function', () => {
    expect(costsSource).toContain('export function calculateCost');
  });

  it('exports formatCost function', () => {
    expect(costsSource).toContain('export function formatCost');
  });

  it('exports CostData interface', () => {
    expect(costsSource).toContain('export interface CostData');
  });
});

describe('Issue #2: Loading messages module exports', () => {
  const messagesSource = fs.readFileSync(
    path.resolve(__dirname, '../lib/loadingMessages.ts'), 'utf-8'
  );

  it('exports STORY_PHASE_MESSAGES', () => {
    expect(messagesSource).toContain('export const STORY_PHASE_MESSAGES');
  });

  it('exports AUDIO_PHASE_MESSAGES', () => {
    expect(messagesSource).toContain('export const AUDIO_PHASE_MESSAGES');
  });

  it('exports pickRandom function', () => {
    expect(messagesSource).toContain('export function pickRandom');
  });
});

describe('Issue #2: LoadingState uses multi-phase interface', () => {
  const loadingSource = fs.readFileSync(
    path.resolve(__dirname, '../components/LoadingState.tsx'), 'utf-8'
  );

  it('exports LoadingPhase interface', () => {
    expect(loadingSource).toContain('export interface LoadingPhase');
  });

  it('accepts phases prop', () => {
    expect(loadingSource).toContain('phases: LoadingPhase[]');
  });

  it('accepts pipelineStart prop', () => {
    expect(loadingSource).toContain('pipelineStart: number | null');
  });
});

describe('Issue #2: page.tsx uses new loading and cost features', () => {
  const pageSource = fs.readFileSync(
    path.resolve(__dirname, '../app/page.tsx'), 'utf-8'
  );

  it('imports pickRandom and message arrays', () => {
    expect(pageSource).toMatch(/import.*pickRandom.*from.*loadingMessages/);
  });

  it('imports calculateCost and formatCost', () => {
    expect(pageSource).toMatch(/import.*calculateCost.*from.*costs/);
    expect(pageSource).toMatch(/import.*formatCost.*from.*costs/);
  });

  it('timing label includes cost estimate', () => {
    expect(pageSource).toContain('Est. cost:');
  });

  it('renamed Audio to Narration in timing label', () => {
    expect(pageSource).toContain('Narration');
    // Should NOT use "Audio" in the timing label anymore
    expect(pageSource).not.toMatch(/`Story.*· Audio \$/);
  });
});
