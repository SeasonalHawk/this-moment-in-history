import { describe, it, expect } from 'vitest';
import {
  STORY_PHASE_MESSAGES,
  AUDIO_PHASE_MESSAGES,
  pickRandom,
} from '@/lib/loadingMessages';

describe('STORY_PHASE_MESSAGES', () => {
  it('has at least 3 messages', () => {
    expect(STORY_PHASE_MESSAGES.length).toBeGreaterThanOrEqual(3);
  });

  it('all messages end with "..."', () => {
    for (const msg of STORY_PHASE_MESSAGES) {
      expect(msg).toMatch(/\.\.\.$/);
    }
  });

  it('all messages are non-empty strings', () => {
    for (const msg of STORY_PHASE_MESSAGES) {
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(10);
    }
  });
});

describe('AUDIO_PHASE_MESSAGES', () => {
  it('has at least 3 messages', () => {
    expect(AUDIO_PHASE_MESSAGES.length).toBeGreaterThanOrEqual(3);
  });

  it('all messages end with "..."', () => {
    for (const msg of AUDIO_PHASE_MESSAGES) {
      expect(msg).toMatch(/\.\.\.$/);
    }
  });

  it('all messages are non-empty strings', () => {
    for (const msg of AUDIO_PHASE_MESSAGES) {
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(10);
    }
  });
});

describe('pickRandom', () => {
  it('returns an element from the array', () => {
    const items = ['a', 'b', 'c'];
    const result = pickRandom(items);
    expect(items).toContain(result);
  });

  it('works with single-element arrays', () => {
    expect(pickRandom(['only'])).toBe('only');
  });

  it('returns a story phase message', () => {
    const msg = pickRandom(STORY_PHASE_MESSAGES);
    expect(STORY_PHASE_MESSAGES).toContain(msg);
  });

  it('returns an audio phase message', () => {
    const msg = pickRandom(AUDIO_PHASE_MESSAGES);
    expect(AUDIO_PHASE_MESSAGES).toContain(msg);
  });
});
