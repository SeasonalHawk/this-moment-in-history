'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeakOptions {
  text: string;
  eventTitle?: string | null;
  eventDate?: string;
  eventYear?: string | null;
  onStart?: () => void;
  onEnd?: () => void;
}

interface PlayBlobOptions {
  onStart?: () => void;
  onEnd?: () => void;
}

export function useTextToSpeech() {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAudio, setHasAudio] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const blobRef = useRef<Blob | null>(null);

  const onStartRef = useRef<(() => void) | undefined>(undefined);
  const onEndRef = useRef<(() => void) | undefined>(undefined);

  // Stable handler ref — avoids identity mismatch on addEventListener/removeEventListener
  const handleEndedRef = useRef(() => {
    setPlaying(false);
    setPaused(true);
    onEndRef.current?.();
  });

  // Full cleanup — destroys audio element and blob (used on new date/genre)
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener('ended', handleEndedRef.current);
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    blobRef.current = null;
    setPlaying(false);
    setPaused(false);
    setHasAudio(false);
    setLoading(false);
  }, []);

  // Warm up audio context — call synchronously inside a user click handler
  // to establish browser audio permission before any async work
  const warmUp = useCallback(() => {
    const audio = new Audio();
    audio.addEventListener('ended', handleEndedRef.current);
    audioRef.current = audio;
  }, []);

  // Explicitly control the loading state from the pipeline orchestrator
  const setLoadingState = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);

  // Play a pre-fetched audio blob directly (used by streaming pipeline)
  const playBlob = useCallback(async (blob: Blob, options?: PlayBlobOptions) => {
    onStartRef.current = options?.onStart;
    onEndRef.current = options?.onEnd;
    blobRef.current = blob;

    // Revoke previous URL (defensive guard)
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(blob);
    urlRef.current = url;

    // Use pre-warmed audio element if available, otherwise create new
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audio.addEventListener('ended', handleEndedRef.current);
      audioRef.current = audio;
    }
    audio.src = url;

    setHasAudio(true);
    setLoading(false);
    await audio.play();
    setPlaying(true);
    setPaused(false);
    onStartRef.current?.();
  }, []);

  // Generate audio via /api/tts and auto-play (standalone, kept as fallback)
  const speak = useCallback(async (options: SpeakOptions) => {
    setError(null);
    setLoading(true);
    onStartRef.current = options.onStart;
    onEndRef.current = options.onEnd;

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: options.text,
          eventTitle: options.eventTitle || undefined,
          eventDate: options.eventDate || undefined,
          eventYear: options.eventYear || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to generate audio' }));
        throw new Error(data.error || 'Failed to generate audio');
      }

      const blob = await response.blob();
      await playBlob(blob, { onStart: options.onStart, onEnd: options.onEnd });
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to play audio');
      setPlaying(false);
      setPaused(false);
      setHasAudio(false);
    } finally {
      setLoading(false);
    }
  }, [playBlob]);

  // Toggle play/pause — returns the new playing state (boolean) so callers
  // don't depend on the stale tts.playing closure (Issue #1 code review fix)
  const togglePlayPause = useCallback((): boolean => {
    if (!audioRef.current) return playing;

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      setPaused(true);
      return false;
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
      setPaused(false);
      return true;
    }
  }, [playing]);

  // Replay from start
  const replay = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
    setPlaying(true);
    setPaused(false);
    onStartRef.current?.();
  }, []);

  // Stop — pauses audio, fires onEnd, keeps blob for download/replay
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlaying(false);
    setPaused(false);
    onEndRef.current?.();
  }, []);

  const download = useCallback((filename?: string) => {
    if (!blobRef.current) return;
    const url = URL.createObjectURL(blobRef.current);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'this-moment-in-history.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    speak, warmUp, playBlob, setLoadingState,
    togglePlayPause, replay, stop, cleanup, download,
    loading, playing, paused, hasAudio, error,
  };
}
