'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import CalendarPicker from '@/components/CalendarPicker';
import StoryCard from '@/components/StoryCard';
import LoadingState from '@/components/LoadingState';
import useHistoryStory from '@/hooks/useHistoryStory';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const { story, metadata, loading, error, spinCount, fetchStory } = useHistoryStory();
  const { speak, stop, download, loading: audioLoading, playing: audioPlaying, hasAudio } = useTextToSpeech();
  const bgMusic = useBackgroundMusic();

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    stop(); // Stop narration (which also stops bg music via onEnd)
    if (date) {
      fetchStory(date, 0);
    }
  };

  const handleSpin = () => {
    stop(); // Stop narration (which also stops bg music via onEnd)
    if (selectedDate) {
      fetchStory(selectedDate, spinCount + 1);
    }
  };

  const handleReadToMe = () => {
    if (story && selectedDate) {
      const dateStr = format(selectedDate, 'MMMM d');
      speak({
        text: story,
        eventTitle: metadata.eventTitle,
        eventDate: dateStr,
        eventYear: metadata.eventYear,
        onStart: () => bgMusic.play(),   // Start bg music when narrator begins
        onEnd: () => bgMusic.stop(),     // Stop bg music when narrator ends
      });
    }
  };

  const handleStopReading = () => {
    stop(); // Fires onEnd callback which stops bg music
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Header */}
      <header className="border-b border-stone-800 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-amber-400 tracking-tight">
            This Moment in History
          </h1>
          <p className="text-stone-400 mt-2">
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

        {/* Story Area */}
        {loading && <LoadingState />}

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 max-w-2xl mx-auto text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => selectedDate && fetchStory(selectedDate, spinCount)}
              className="mt-2 text-sm text-red-300 underline hover:text-red-200"
            >
              Try again
            </button>
          </div>
        )}

        {story && selectedDate && !loading && (
          <StoryCard
            story={story}
            date={selectedDate}
            eventTitle={metadata.eventTitle}
            eventYear={metadata.eventYear}
            mlaCitation={metadata.mlaCitation}
            onSpin={handleSpin}
            spinning={loading}
            onReadToMe={handleReadToMe}
            onStopReading={handleStopReading}
            onDownloadAudio={() => {
              const title = metadata.eventTitle || 'story';
              const safeName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
              download(`this-moment-in-history-${safeName}.mp3`);
            }}
            audioLoading={audioLoading}
            audioPlaying={audioPlaying}
            hasAudio={hasAudio}
            musicMuted={bgMusic.muted}
            onToggleMusic={bgMusic.toggleMute}
          />
        )}

        {/* Empty state */}
        {!selectedDate && !loading && (
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
