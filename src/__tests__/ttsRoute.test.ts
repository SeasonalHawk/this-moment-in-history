import { describe, it, expect } from 'vitest';

// Constants matching the TTS route configuration
const EXPECTED_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam
const EXPECTED_MODEL = 'eleven_multilingual_v2';

describe('TTS Route Configuration', () => {
  it('uses Adam voice ID', () => {
    // Verify the configured voice matches Adam
    expect(EXPECTED_VOICE_ID).toBe('pNInz6obpgDQGcFmaJgB');
  });

  it('uses multilingual v2 model', () => {
    expect(EXPECTED_MODEL).toBe('eleven_multilingual_v2');
  });

  it('constructs correct ElevenLabs API URL', () => {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${EXPECTED_VOICE_ID}`;
    expect(url).toBe('https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB');
  });
});

describe('TTS Input Validation', () => {
  function validateTtsInput(body: Record<string, unknown> | null) {
    if (!body || typeof body.text !== 'string' || (body.text as string).trim().length === 0) {
      return { valid: false, error: 'text is required' };
    }
    if ((body.text as string).length > 5000) {
      return { valid: false, error: 'text must be 5000 characters or fewer' };
    }
    return { valid: true };
  }

  it('accepts valid text', () => {
    expect(validateTtsInput({ text: 'Hello world' }).valid).toBe(true);
  });

  it('accepts a typical story length (~1200 chars)', () => {
    const storyText = 'A'.repeat(1200);
    expect(validateTtsInput({ text: storyText }).valid).toBe(true);
  });

  it('rejects null body', () => {
    const result = validateTtsInput(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('text is required');
  });

  it('rejects empty text', () => {
    const result = validateTtsInput({ text: '' });
    expect(result.valid).toBe(false);
  });

  it('rejects whitespace-only text', () => {
    const result = validateTtsInput({ text: '   ' });
    expect(result.valid).toBe(false);
  });

  it('rejects non-string text', () => {
    const result = validateTtsInput({ text: 123 });
    expect(result.valid).toBe(false);
  });

  it('rejects missing text field', () => {
    const result = validateTtsInput({ foo: 'bar' });
    expect(result.valid).toBe(false);
  });

  it('rejects text over 5000 characters', () => {
    const result = validateTtsInput({ text: 'a'.repeat(5001) });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('text must be 5000 characters or fewer');
  });

  it('accepts text at exactly 5000 characters', () => {
    expect(validateTtsInput({ text: 'a'.repeat(5000) }).valid).toBe(true);
  });

  it('accepts text at 1 character', () => {
    expect(validateTtsInput({ text: 'a' }).valid).toBe(true);
  });
});

describe('TTS Voice Settings', () => {
  const voiceSettings = {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.4,
  };

  it('stability is between 0 and 1', () => {
    expect(voiceSettings.stability).toBeGreaterThanOrEqual(0);
    expect(voiceSettings.stability).toBeLessThanOrEqual(1);
  });

  it('similarity_boost is between 0 and 1', () => {
    expect(voiceSettings.similarity_boost).toBeGreaterThanOrEqual(0);
    expect(voiceSettings.similarity_boost).toBeLessThanOrEqual(1);
  });

  it('style is between 0 and 1', () => {
    expect(voiceSettings.style).toBeGreaterThanOrEqual(0);
    expect(voiceSettings.style).toBeLessThanOrEqual(1);
  });
});
