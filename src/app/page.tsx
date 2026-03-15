'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import CalendarPicker from '@/components/CalendarPicker';
import StoryCard from '@/components/StoryCard';
import LoadingState, { type LoadingPhase } from '@/components/LoadingState';
import useHistoryStory from '@/hooks/useHistoryStory';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { getRandomGenre } from '@/lib/genres';
import { pickRandom, STORY_PHASE_MESSAGES, AUDIO_PHASE_MESSAGES } from '@/lib/loadingMessages';
import { calculateCost, formatCost, type CostData } from '@/lib/costs';

interface PipelineTiming {
  storyMs: number | null;
  audioMs: number | null;
}

const formatMs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [pipelineStart, setPipelineStart] = useState<number | null>(null);
  const [timing, setTiming] = useState<PipelineTiming>({ storyMs: null, audioMs: null });
  const [phases, setPhases] = useState<LoadingPhase[]>([]);
  const [costData, setCostData] = useState<CostData | null>(null);
  const phaseStartRef = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  const history = useHistoryStory();
  const tts = useTextToSpeech();
  const bgMusic = useBackgroundMusic();

  /**
   * Unified streaming pipeline: calls /api/pipeline which returns NDJSON.
   * Phase 1: story JSON line → display story immediately
   * Phase 2: audio base64 line → decode and play
   * Server-side overlap: TTS fires immediately after story gen completes,
   * without waiting for client round-trip.
   */
  const runPipeline = useCallback(async (date: Date, genre?: string) => {
    // Abort any in-flight pipeline to prevent race conditions when
    // the user clicks rapidly or selects a new date mid-stream.
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Full reset
    tts.cleanup();
    bgMusic.stop();
    setTiming({ storyMs: null, audioMs: null });
    setCostData(null);

    const now = Date.now();
    setPipelineStart(now);
    phaseStartRef.current = now;

    // Pick random themed messages for this run
    const storyMsg = pickRandom(STORY_PHASE_MESSAGES);
    const audioMsg = pickRandom(AUDIO_PHASE_MESSAGES);
    setPhases([
      { label: storyMsg, startTime: now },
      { label: audioMsg, startTime: 0 },
    ]);

    // Warm up audio elements during user click to satisfy autoplay policy.
    // Both TTS and background music need their Audio elements created
    // synchronously within the user gesture to avoid browser autoplay blocks.
    tts.warmUp();
    bgMusic.warmUp();
    history.startLoading();

    const month = date.getMonth() + 1;
    const day = date.getDate();

    try {
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, day, ...(genre ? { genre } : {}) }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Pipeline failed' }));
        throw new Error(data.error || 'Pipeline failed');
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (controller.signal.aborted) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop()!; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          let event;
          try {
            event = JSON.parse(line);
          } catch {
            console.warn('Skipping malformed NDJSON line:', line.slice(0, 100));
            continue;
          }

          if (event.type === 'story') {
            const storyEnd = Date.now();
            const storyMs = storyEnd - phaseStartRef.current;
            setTiming(prev => ({ ...prev, storyMs }));
            phaseStartRef.current = storyEnd;

            // Close phase 1, open phase 2
            setPhases(prev => [
              { ...prev[0], endTime: storyEnd },
              { ...prev[1], startTime: storyEnd },
            ]);

            // Capture token usage for cost estimation
            if (event.inputTokens !== undefined && event.outputTokens !== undefined) {
              setCostData({ inputTokens: event.inputTokens, outputTokens: event.outputTokens, ttsCharacters: 0 });
            }

            // Display story immediately — TTS is already generating on the server
            history.setResult({
              story: event.story,
              metadata: {
                eventTitle: event.eventTitle,
                eventYear: event.eventYear,
                mlaCitation: event.mlaCitation,
              },
              genre: event.genre,
            });

            // Show audio phase message while audio generates
            tts.setLoadingState(true);
          }

          if (event.type === 'audio') {
            const audioEnd = Date.now();
            const audioMs = audioEnd - phaseStartRef.current;
            setTiming(prev => ({ ...prev, audioMs }));

            // Close phase 2
            setPhases(prev => [
              prev[0],
              { ...prev[1], endTime: audioEnd },
            ]);

            // Capture TTS character count for cost estimation
            if (event.ttsCharacters !== undefined) {
              setCostData(prev => prev ? { ...prev, ttsCharacters: event.ttsCharacters } : prev);
            }

            // Decode base64 → blob → play
            const binaryString = atob(event.audio);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'audio/mpeg' });

            await tts.playBlob(blob, {
              onStart: () => bgMusic.play(),
              onEnd: () => bgMusic.fadeOut(),
            });
          }

          if (event.type === 'error') {
            throw new Error(event.error);
          }
        }
      }
    } catch (err) {
      // Silently ignore aborted requests — the new pipeline will take over
      if ((err as Error).name === 'AbortError') return;
      history.setErrorState((err as Error).message || 'Something went wrong');
      tts.setLoadingState(false);
    } finally {
      setPipelineStart(null);
    }
  }, [tts, bgMusic, history]);

  const handleDateSelect = async (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) await runPipeline(date);
  };

  const handleRandomHistory = async () => {
    if (!selectedDate) return;
    await runPipeline(selectedDate, getRandomGenre());
  };

  const handleTogglePlayPause = () => {
    const nowPlaying = tts.togglePlayPause();
    if (nowPlaying) {
      bgMusic.resume();
    } else {
      bgMusic.pause();
    }
  };

  const handleReplay = () => {
    tts.replay();
    bgMusic.play();
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Header */}
      <header className="border-b border-stone-800 py-6">
        <div className="max-w-4xl mx-auto px-4 flex flex-col items-center gap-3">
          <Image
            src="/logo-full.png"
            alt="This Moment in History"
            width={400}
            height={224}
            priority
            className="w-full max-w-[400px] h-auto"
          />
          <p className="text-stone-400 mt-1">
            Pick a date. Step into the past.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Calendar */}
        <CalendarPicker
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />

        {/* Story Area — both cards persist in DOM once pipeline starts */}
        {phases.length > 0 && (
          <LoadingState
            phases={phases}
            pipelineStart={pipelineStart}
            autoExpand={pipelineStart !== null}
            autoCollapse={tts.playing}
          />
        )}

        {history.error && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 max-w-2xl mx-auto text-center">
            <p className="text-red-400">{history.error}</p>
            <button
              onClick={() => selectedDate && runPipeline(selectedDate)}
              className="mt-2 text-sm text-red-300 underline hover:text-red-200"
            >
              Try again
            </button>
          </div>
        )}

        {history.story && selectedDate && (
          <StoryCard
            story={history.story}
            date={selectedDate}
            eventTitle={history.metadata.eventTitle}
            eventYear={history.metadata.eventYear}
            mlaCitation={history.metadata.mlaCitation}
            genre={history.activeGenre}
            onRandomHistory={handleRandomHistory}
            spinning={history.loading || tts.loading}
            onTogglePlayPause={handleTogglePlayPause}
            onReplay={handleReplay}
            onDownloadAudio={() => {
              const title = history.metadata.eventTitle || 'story';
              const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
              tts.download(`this-moment-in-history-${safeName}.mp3`);
            }}
            audioPlaying={tts.playing}
            hasAudio={tts.hasAudio}
            musicMuted={bgMusic.muted}
            onToggleMusic={bgMusic.toggleMute}
            autoExpand={tts.playing}
            timingLabel={
              timing.storyMs !== null && timing.audioMs !== null
                ? `Story ${formatMs(timing.storyMs)} · Narration ${formatMs(timing.audioMs)} · Total ${formatMs(timing.storyMs + timing.audioMs)}${
                    costData && costData.ttsCharacters > 0
                      ? ` · Est. cost: ${formatCost(calculateCost(costData))}`
                      : ''
                  }`
                : timing.storyMs !== null
                  ? `Story ${formatMs(timing.storyMs)}`
                  : undefined
            }
          />
        )}

        {/* Empty state */}
        {!selectedDate && !history.loading && (
          <div className="text-center py-12">
            <p className="text-stone-500 text-lg">
              Select a date from the calendar above to uncover a moment in history.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800 py-4 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center text-stone-600 text-sm">
          Built with Kajiro IQ Pro | Powered by Anthropic Claude
        </div>
      </footer>
    </div>
  );
}
