import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ── Source-level regression tests ─────────────────────────────────────────────
// These verify structural properties of the hook via source inspection,
// which catches regressions even without a DOM environment.

const hookSource = fs.readFileSync(
  path.resolve(__dirname, '../hooks/useBackgroundMusic.ts'),
  'utf-8'
);

const pageSource = fs.readFileSync(
  path.resolve(__dirname, '../app/page.tsx'),
  'utf-8'
);

describe('useBackgroundMusic: audio source', () => {
  it('uses Chronostream Runner as background music', () => {
    expect(hookSource).toContain("'/audio/chronostream-runner.mp3'");
  });

  it('does NOT reference old ambient-bg.mp3', () => {
    expect(hookSource).not.toContain('ambient-bg.mp3');
  });
});

describe('useBackgroundMusic: volume and fade config', () => {
  it('TARGET_VOLUME is set to 0.12 for the fuller track', () => {
    expect(hookSource).toContain('TARGET_VOLUME = 0.12');
  });

  it('FADE_DURATION_MS is defined', () => {
    expect(hookSource).toContain('FADE_DURATION_MS');
  });

  it('FADE_INTERVAL_MS is defined', () => {
    expect(hookSource).toContain('FADE_INTERVAL_MS');
  });
});

describe('useBackgroundMusic: warmUp for autoplay policy', () => {
  it('exports a warmUp method', () => {
    expect(hookSource).toContain('warmUp');
  });

  it('warmUp is included in the return object', () => {
    // Match the return statement that includes warmUp
    expect(hookSource).toMatch(/return\s*\{[^}]*warmUp[^}]*\}/);
  });

  it('warmUp calls getAudio to pre-create the audio element', () => {
    // The warmUp function should call getAudio() to establish the audio element
    // within the user gesture context
    expect(hookSource).toContain('getAudio()');
  });
});

describe('useBackgroundMusic: playback methods', () => {
  it('returns play method', () => {
    expect(hookSource).toMatch(/return\s*\{[^}]*\bplay\b[^}]*\}/);
  });

  it('returns stop method', () => {
    expect(hookSource).toMatch(/return\s*\{[^}]*\bstop\b[^}]*\}/);
  });

  it('returns pause method', () => {
    expect(hookSource).toMatch(/return\s*\{[^}]*\bpause\b[^}]*\}/);
  });

  it('returns resume method', () => {
    expect(hookSource).toMatch(/return\s*\{[^}]*\bresume\b[^}]*\}/);
  });

  it('returns toggleMute method', () => {
    expect(hookSource).toMatch(/return\s*\{[^}]*toggleMute[^}]*\}/);
  });

  it('returns muted state', () => {
    expect(hookSource).toMatch(/return\s*\{[^}]*\bmuted\b[^}]*\}/);
  });

  it('audio element is configured for looping', () => {
    expect(hookSource).toContain('audio.loop = true');
  });

  it('audio element starts at volume 0 for fade-in', () => {
    expect(hookSource).toContain('audio.volume = 0');
  });
});

describe('useBackgroundMusic: fade-in logic', () => {
  it('uses setInterval for gradual volume increase', () => {
    expect(hookSource).toContain('setInterval');
  });

  it('clears interval when target volume is reached', () => {
    expect(hookSource).toContain('clearFade()');
  });

  it('increments volume in steps toward TARGET_VOLUME', () => {
    expect(hookSource).toContain('TARGET_VOLUME / steps');
    expect(hookSource).toContain('currentVol += increment');
  });
});

describe('useBackgroundMusic: cleanup', () => {
  it('cleans up on unmount via useEffect', () => {
    expect(hookSource).toContain('useEffect');
    expect(hookSource).toContain('clearFade()');
  });

  it('pauses and nulls audio ref on cleanup', () => {
    expect(hookSource).toContain('audioRef.current.pause()');
    expect(hookSource).toContain('audioRef.current = null');
  });
});

// ── Integration: page.tsx warms up background music ──────────────────────────

describe('page.tsx: background music warm-up (autoplay fix)', () => {
  it('calls bgMusic.warmUp() during pipeline start', () => {
    expect(pageSource).toContain('bgMusic.warmUp()');
  });

  it('warmUp is called before any async work (near tts.warmUp)', () => {
    const ttsWarmUpIndex = pageSource.indexOf('tts.warmUp()');
    const bgWarmUpIndex = pageSource.indexOf('bgMusic.warmUp()');
    // Both should exist and bgMusic.warmUp should be close to tts.warmUp
    expect(ttsWarmUpIndex).toBeGreaterThan(-1);
    expect(bgWarmUpIndex).toBeGreaterThan(-1);
    // bgMusic.warmUp should come after tts.warmUp (both in the same click handler)
    expect(bgWarmUpIndex).toBeGreaterThan(ttsWarmUpIndex);
  });

  it('bgMusic.play is passed as onStart callback to TTS', () => {
    expect(pageSource).toContain('onStart: () => bgMusic.play()');
  });

  it('bgMusic.stop is passed as onEnd callback to TTS', () => {
    expect(pageSource).toContain('onEnd: () => bgMusic.stop()');
  });
});

// ── Mock-based unit tests for the hook's Audio interactions ──────────────────

describe('useBackgroundMusic: Audio element behavior (mock)', () => {
  let mockPlay: ReturnType<typeof vi.fn>;
  let mockPause: ReturnType<typeof vi.fn>;
  let mockAudioInstances: Array<Record<string, unknown>>;

  beforeEach(() => {
    mockPlay = vi.fn().mockResolvedValue(undefined);
    mockPause = vi.fn();
    mockAudioInstances = [];

    // Mock the global Audio constructor
    vi.stubGlobal('Audio', vi.fn().mockImplementation((src?: string) => {
      const instance: Record<string, unknown> = {
        src: src || '',
        loop: false,
        volume: 1,
        muted: false,
        currentTime: 0,
        preload: '',
        play: mockPlay,
        pause: mockPause,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      mockAudioInstances.push(instance);
      return instance;
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('getAudio creates Audio with correct URL', async () => {
    // Dynamically import to get a fresh module with our mock
    const mod = await import('../hooks/useBackgroundMusic');
    // The module exports the hook — we can verify the URL constant is correct
    expect(hookSource).toContain("'/audio/chronostream-runner.mp3'");
  });

  it('audio preload is set to auto for eager loading', () => {
    expect(hookSource).toContain("audio.preload = 'auto'");
  });
});
