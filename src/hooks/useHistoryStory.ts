'use client';

import { useState, useCallback } from 'react';

interface StoryMetadata {
  eventTitle: string | null;
  eventYear: string | null;
  mlaCitation: string | null;
}

interface UseHistoryStoryReturn {
  story: string | null;
  metadata: StoryMetadata;
  loading: boolean;
  error: string | null;
  spinCount: number;
  fetchStory: (date: Date, spin?: number) => Promise<void>;
}

const emptyMetadata: StoryMetadata = { eventTitle: null, eventYear: null, mlaCitation: null };

export default function useHistoryStory(): UseHistoryStoryReturn {
  const [story, setStory] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<StoryMetadata>(emptyMetadata);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spinCount, setSpinCount] = useState(0);

  const fetchStory = useCallback(async (date: Date, spin?: number) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const currentSpin = spin ?? 0;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, day, spin: currentSpin }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setStory(data.story);
      setMetadata({
        eventTitle: data.eventTitle || null,
        eventYear: data.eventYear || null,
        mlaCitation: data.mlaCitation || null,
      });
      setSpinCount(currentSpin);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      setStory(null);
      setMetadata(emptyMetadata);
    } finally {
      setLoading(false);
    }
  }, []);

  return { story, metadata, loading, error, spinCount, fetchStory };
}
