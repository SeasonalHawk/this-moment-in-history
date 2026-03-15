'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

const BG_MUSIC_URL = '/audio/chronostream-runner.mp3';
const TARGET_VOLUME = 0.12; // 12% volume — tuned for the fuller Voyagers!-themed track
const FADE_IN_MS = 2000; // 2 seconds fade-in
const FADE_OUT_MS = 3000; // 3 seconds fade-out — lets the music trail off gracefully
const FADE_INTERVAL_MS = 50; // Update every 50ms

export function useBackgroundMusic() {
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear any running fade interval
  const clearFade = useCallback(() => {
    if (fadeRef.current) {
      clearInterval(fadeRef.current);
      fadeRef.current = null;
    }
  }, []);

  // Initialize audio element lazily
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio(BG_MUSIC_URL);
      audio.loop = true;
      audio.volume = 0;
      audio.preload = 'auto';
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  // Warm up audio element — call synchronously inside a user click handler
  // to establish browser audio permission before any async work.
  // Without this, the browser blocks play() when called from an async callback.
  const warmUp = useCallback(() => {
    getAudio();
  }, [getAudio]);

  // Start music with fade-in — called when narrator begins reading
  const play = useCallback(() => {
    clearFade();
    const audio = getAudio();
    audio.volume = 0;
    audio.muted = muted;
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Browser may block autoplay — that's OK
    });

    // Fade in from 0 to TARGET_VOLUME
    const steps = FADE_IN_MS / FADE_INTERVAL_MS;
    const increment = TARGET_VOLUME / steps;
    let currentVol = 0;

    fadeRef.current = setInterval(() => {
      currentVol += increment;
      if (currentVol >= TARGET_VOLUME) {
        currentVol = TARGET_VOLUME;
        clearFade();
      }
      if (audioRef.current) {
        audioRef.current.volume = currentVol;
      }
    }, FADE_INTERVAL_MS);
  }, [getAudio, muted, clearFade]);

  // Fade out gracefully — volume ramps from current level to 0, then pauses.
  // Called when narration ends so the music trails off professionally.
  const fadeOut = useCallback(() => {
    clearFade();
    if (!audioRef.current) return;

    const startVol = audioRef.current.volume;
    if (startVol <= 0) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      return;
    }

    const steps = FADE_OUT_MS / FADE_INTERVAL_MS;
    const decrement = startVol / steps;
    let currentVol = startVol;

    fadeRef.current = setInterval(() => {
      currentVol -= decrement;
      if (currentVol <= 0) {
        currentVol = 0;
        clearFade();
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }
      if (audioRef.current) {
        audioRef.current.volume = currentVol;
      }
    }, FADE_INTERVAL_MS);
  }, [clearFade]);

  // Hard stop — immediately pauses and resets (used on pipeline restart)
  const stop = useCallback(() => {
    clearFade();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0;
    }
  }, [clearFade]);

  // Pause music — called when narrator is paused
  const pause = useCallback(() => {
    clearFade();
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [clearFade]);

  // Resume music — called when narrator resumes
  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, []);

  // Toggle mute — only mutes/unmutes, does NOT start or stop playback
  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const newMuted = !prev;
      if (audioRef.current) {
        audioRef.current.muted = newMuted;
      }
      return newMuted;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearFade();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [clearFade]);

  return { muted, warmUp, play, fadeOut, stop, pause, resume, toggleMute };
}
