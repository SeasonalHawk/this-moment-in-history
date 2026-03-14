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

export function useTextToSpeech() {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAudio, setHasAudio] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const blobRef = useRef<Blob | null>(null);

  const onEndRef = useRef<(() => void) | undefined>(undefined);

  function handleEnded() {
    setPlaying(false);
    onEndRef.current?.();
  }

  // Clean up object URL and audio
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener('ended', handleEnded);
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    blobRef.current = null;
    setPlaying(false);
    setHasAudio(false);
  }, []);

  const speak = useCallback(async (options: SpeakOptions) => {
    // Stop any currently playing audio
    cleanup();
    setError(null);
    setLoading(true);
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
      blobRef.current = blob;
      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      const audio = new Audio(url);
      audio.addEventListener('ended', handleEnded);
      audioRef.current = audio;

      setHasAudio(true);
      await audio.play();
      setPlaying(true);
      options.onStart?.();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to play audio');
      setPlaying(false);
      setHasAudio(false);
    } finally {
      setLoading(false);
    }
  }, [cleanup]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener('ended', handleEnded);
      audioRef.current = null;
    }
    setPlaying(false);
    onEndRef.current?.();
    // Keep blob and URL so user can still download after stopping
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

  return { speak, stop, download, loading, playing, hasAudio, error };
}
