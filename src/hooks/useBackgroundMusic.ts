'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

const BG_MUSIC_URL = '/audio/ambient-bg.mp3';
const DEFAULT_VOLUME = 0.10; // 10% volume

export function useBackgroundMusic() {
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element lazily
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio(BG_MUSIC_URL);
      audio.loop = true;
      audio.volume = DEFAULT_VOLUME;
      audio.preload = 'auto';
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  // Start music — called when narrator begins reading
  const play = useCallback(() => {
    const audio = getAudio();
    audio.muted = muted;
    audio.play().catch(() => {
      // Browser may block autoplay — that's OK
    });
  }, [getAudio, muted]);

  // Stop music — called when narrator stops reading
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reset to start for next play
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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return { muted, play, stop, toggleMute };
}
