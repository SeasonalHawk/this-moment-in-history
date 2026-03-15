'use client';

import { useState, useCallback } from 'react';

interface StoryMetadata {
  eventTitle: string | null;
  eventYear: string | null;
  mlaCitation: string | null;
}

interface FetchStoryResult {
  story: string;
  metadata: StoryMetadata;
  genre: string | null;
}

const emptyMetadata: StoryMetadata = { eventTitle: null, eventYear: null, mlaCitation: null };

export default function useHistoryStory() {
  const [story, setStory] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<StoryMetadata>(emptyMetadata);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);

  // Standalone fetch — calls /api/history directly (App Router route)
  const fetchStory = useCallback(async (date: Date, genre?: string): Promise<FetchStoryResult | null> => {
    const month = date.getMonth() + 1;
    const day = date.getDate();

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, day, ...(genre ? { genre } : {}) }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      const storyText = data.story as string;
      const meta: StoryMetadata = {
        eventTitle: data.eventTitle || null,
        eventYear: data.eventYear || null,
        mlaCitation: data.mlaCitation || null,
      };
      const activeGenreValue = (data.genre as string) || null;

      setStory(storyText);
      setMetadata(meta);
      setActiveGenre(activeGenreValue);

      return { story: storyText, metadata: meta, genre: activeGenreValue };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      setStory(null);
      setMetadata(emptyMetadata);
      setActiveGenre(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Pipeline helpers — allow page.tsx to update state from streaming pipeline
  const startLoading = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  const setResult = useCallback((data: { story: string; metadata: StoryMetadata; genre: string | null }) => {
    setStory(data.story);
    setMetadata(data.metadata);
    setActiveGenre(data.genre);
    setLoading(false);
    setError(null);
  }, []);

  const setErrorState = useCallback((message: string) => {
    setError(message);
    setLoading(false);
    setStory(null);
    setMetadata(emptyMetadata);
    setActiveGenre(null);
  }, []);

  return {
    story, metadata, loading, error, activeGenre,
    fetchStory, startLoading, setResult, setErrorState,
  };
}
