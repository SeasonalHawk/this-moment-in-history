'use client';

import { format } from 'date-fns';

interface StoryCardProps {
  story: string;
  date: Date;
  eventTitle: string | null;
  eventYear: string | null;
  mlaCitation: string | null;
  onSpin: () => void;
  spinning: boolean;
  onReadToMe: () => void;
  onStopReading: () => void;
  onDownloadAudio: () => void;
  audioLoading: boolean;
  audioPlaying: boolean;
  hasAudio: boolean;
  musicMuted: boolean;
  onToggleMusic: () => void;
}

export default function StoryCard({
  story, date, eventTitle, eventYear, mlaCitation,
  onSpin, spinning,
  onReadToMe, onStopReading, onDownloadAudio,
  audioLoading, audioPlaying, hasAudio,
  musicMuted, onToggleMusic,
}: StoryCardProps) {
  return (
    <div className="bg-stone-900 border border-stone-700 rounded-xl p-6 shadow-lg max-w-2xl mx-auto">
      {/* Header with date and action buttons */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-amber-400 font-semibold text-lg">
          {format(date, 'MMMM d')}
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Background music toggle */}
          <button
            onClick={onToggleMusic}
            className={`px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-sm font-medium ${
              !musicMuted
                ? 'bg-stone-700 hover:bg-stone-600 text-stone-300'
                : 'bg-stone-800 text-stone-500 hover:bg-stone-700 hover:text-stone-400'
            }`}
            title={musicMuted ? 'Unmute background music' : 'Mute background music'}
          >
            {!musicMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </button>

          {/* Read to Me / Stop Reading button */}
          {audioPlaying ? (
            <button
              onClick={onStopReading}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              Stop Reading
            </button>
          ) : (
            <button
              onClick={onReadToMe}
              disabled={audioLoading || spinning}
              className="px-4 py-2 bg-stone-700 hover:bg-stone-600 disabled:bg-stone-800 disabled:text-stone-500 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
            >
              {audioLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Loading audio...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                  Read to Me
                </>
              )}
            </button>
          )}

          {/* Download audio button — only shows after audio has been generated */}
          {hasAudio && (
            <button
              onClick={onDownloadAudio}
              className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2"
              title="Download audio"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </button>
          )}

          {/* Spin button */}
          <button
            onClick={onSpin}
            disabled={spinning}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 disabled:text-stone-500 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
          >
            {spinning ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Spinning...
              </>
            ) : (
              'Spin Your Luck'
            )}
          </button>
        </div>
      </div>

      {/* Event title and year */}
      {eventTitle && (
        <div className="mb-4 pb-3 border-b border-stone-800">
          <h3 className="text-stone-100 font-semibold text-xl">
            {eventTitle}
            {eventYear && <span className="text-amber-500 ml-2 text-base font-normal">({eventYear})</span>}
          </h3>
        </div>
      )}

      {/* Story text */}
      <div className="prose prose-invert prose-stone max-w-none">
        <p className="text-stone-300 leading-relaxed whitespace-pre-wrap">
          {story}
        </p>
      </div>

      {/* MLA Citation */}
      {mlaCitation && (
        <div className="mt-6 pt-4 border-t border-stone-800">
          <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Reference</p>
          <p className="text-stone-400 text-sm italic leading-relaxed">
            {mlaCitation}
          </p>
        </div>
      )}
    </div>
  );
}
