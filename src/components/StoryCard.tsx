'use client';

import { format } from 'date-fns';
import Collapsible from './Collapsible';

interface StoryCardProps {
  story: string;
  date: Date;
  eventTitle: string | null;
  eventYear: string | null;
  mlaCitation: string | null;
  genre: string | null;
  onRandomHistory: () => void;
  spinning: boolean;
  onTogglePlayPause: () => void;
  onReplay: () => void;
  onDownloadAudio: () => void;
  audioPlaying: boolean;
  hasAudio: boolean;
  musicMuted: boolean;
  onToggleMusic: () => void;
  timingLabel?: string;
  /** When true, auto-expands the card body (one-way trigger). */
  autoExpand?: boolean;
}

export default function StoryCard({
  story, date, eventTitle, eventYear, mlaCitation,
  genre, onRandomHistory, spinning,
  onTogglePlayPause, onReplay, onDownloadAudio,
  audioPlaying, hasAudio,
  musicMuted, onToggleMusic, timingLabel,
  autoExpand = false,
}: StoryCardProps) {
  // System-controlled: expanded state comes directly from prop.
  const expanded = autoExpand;

  const header = (
    <div className="flex items-center gap-3 min-w-0">
      <h2 className="text-amber-400 font-semibold text-lg shrink-0">
        {format(date, 'MMMM d')}
      </h2>
      {eventTitle && (
        <span className="text-stone-400 text-sm truncate">
          {eventTitle}
          {eventYear && <span className="text-stone-500 ml-1">({eventYear})</span>}
        </span>
      )}
      {!expanded && !hasAudio && (
        <span className="text-stone-600 text-xs ml-auto shrink-0 animate-pulse">
          Loading narration…
        </span>
      )}
    </div>
  );

  return (
    <Collapsible
      id="story-card-content"
      expanded={expanded}
      locked
      header={header}
      className="bg-stone-900 border border-stone-700 rounded-xl p-6 shadow-lg max-w-2xl mx-auto"
    >
      <div className="mt-4">
        {/* Action buttons */}
        <div className="flex items-center justify-end mb-4 flex-wrap gap-2">
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

          {/* Audio controls — only shown when audio is ready */}
          {hasAudio && (
            <>
              {/* Play/Pause toggle */}
              <button
                onClick={onTogglePlayPause}
                className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2"
              >
                {audioPlaying ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                    Pause
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Play
                  </>
                )}
              </button>

              {/* Replay button */}
              <button
                onClick={onReplay}
                className="px-3 py-2 bg-stone-700 hover:bg-stone-600 text-white font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                title="Replay from start"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </button>

              {/* Download button */}
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
            </>
          )}

          {/* Random History button */}
          <button
            onClick={onRandomHistory}
            disabled={spinning}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 disabled:text-stone-500 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
          >
            {spinning ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Discovering...
              </>
            ) : (
              'Random History'
            )}
          </button>
        </div>

        {/* Genre badge */}
        {genre && (
          <div className="mb-3">
            <span className="inline-block px-3 py-1 bg-amber-600/20 border border-amber-600/40 text-amber-400 text-sm font-medium rounded-full">
              {genre}
            </span>
          </div>
        )}

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

        {/* Pipeline timing */}
        {timingLabel && (
          <div className="mt-4 pt-3 border-t border-stone-800/50" data-testid="timing-label">
            <p className="text-stone-600 text-xs font-mono text-center">
              {timingLabel}
            </p>
          </div>
        )}
      </div>
    </Collapsible>
  );
}
