'use client';

import { useState, useRef, useEffect } from 'react';
import Collapsible from './Collapsible';

export interface LoadingPhase {
  /** Display message for this phase (e.g. "Searching the archives...") */
  label: string;
  /** Timestamp (ms) when the phase started — 0 means not started yet */
  startTime: number;
  /** Timestamp (ms) when the phase ended — undefined means still active or waiting */
  endTime?: number;
}

interface LoadingStateProps {
  phases: LoadingPhase[];
  pipelineStart: number | null;
  /** When true, auto-expands the card (one-way trigger). */
  autoExpand?: boolean;
  /** When true, auto-collapses the card (one-way trigger). */
  autoCollapse?: boolean;
}

/**
 * Multi-phase loading indicator with live-updating per-phase timers.
 *
 * Phase states:
 *   - Completed (endTime set): dimmed text, fixed duration
 *   - Active (startTime > 0, no endTime): amber text, live timer
 *   - Waiting (startTime === 0): muted text, ellipsis
 *
 * The phase progress and skeleton lines are collapsible — the header
 * (quill icon + title + elapsed timer) stays visible when collapsed.
 */
export default function LoadingState({ phases, pipelineStart, autoExpand = false, autoCollapse = false }: LoadingStateProps) {
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derive expanded state directly from props — system-controlled (locked).
  const expanded = autoExpand && !autoCollapse;

  // Tick every 250ms to update live timers
  useEffect(() => {
    if (!pipelineStart) return;

    intervalRef.current = setInterval(() => setTick(t => t + 1), 250);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pipelineStart]);

  // Suppress unused-var lint for the tick counter (drives re-renders)
  void tick;

  /** Format milliseconds as "3.2s" */
  const formatMs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

  /** Calculate elapsed for a phase */
  const phaseElapsed = (phase: LoadingPhase): string => {
    if (phase.endTime) return formatMs(phase.endTime - phase.startTime);
    if (phase.startTime > 0) return formatMs(Date.now() - phase.startTime);
    return '';
  };

  /** Determine phase visual state */
  const phaseState = (phase: LoadingPhase): 'completed' | 'active' | 'waiting' => {
    if (phase.endTime) return 'completed';
    if (phase.startTime > 0) return 'active';
    return 'waiting';
  };

  const header = (
    <div className="flex items-center gap-3">
      <svg
        className="w-6 h-6 text-amber-400 animate-bounce"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
      </svg>
      <span className="text-amber-400 font-medium">
        Preparing your moment in history
      </span>
      {pipelineStart && (
        <span className="text-stone-500 text-sm font-mono ml-auto" data-testid="elapsed-timer">
          {formatMs(Date.now() - pipelineStart)}
        </span>
      )}
    </div>
  );

  return (
    <Collapsible
      id="loading-state-content"
      expanded={expanded}
      locked
      header={header}
      className="bg-stone-900 border border-stone-700 rounded-xl p-6 shadow-lg max-w-2xl mx-auto"
    >
      {/* Phase progress rows */}
      <div className="space-y-3 mb-6 mt-5" data-testid="phase-list">
        {phases.map((phase, i) => {
          const state = phaseState(phase);
          return (
            <div
              key={i}
              className="flex items-center gap-3"
              data-testid={`phase-${i}`}
              data-phase-state={state}
            >
              {/* Phase indicator */}
              {state === 'completed' && (
                <span className="w-5 h-5 flex items-center justify-center text-green-500 text-sm" aria-label="completed">✓</span>
              )}
              {state === 'active' && (
                <span className="w-5 h-5 flex items-center justify-center">
                  <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />
                </span>
              )}
              {state === 'waiting' && (
                <span className="w-5 h-5 flex items-center justify-center">
                  <span className="w-2.5 h-2.5 bg-stone-600 rounded-full" />
                </span>
              )}

              {/* Phase label */}
              <span
                className={
                  state === 'active'
                    ? 'text-amber-400 font-medium text-sm'
                    : state === 'completed'
                      ? 'text-stone-500 text-sm'
                      : 'text-stone-600 text-sm'
                }
              >
                {phase.label}
              </span>

              {/* Phase timer */}
              <span
                className={`text-sm font-mono ml-auto ${
                  state === 'active' ? 'text-amber-400' : 'text-stone-600'
                }`}
              >
                {state === 'active' && phaseElapsed(phase)}
                {state === 'completed' && phaseElapsed(phase)}
                {state === 'waiting' && '—'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Skeleton lines */}
      <div className="space-y-3">
        <div className="h-4 bg-stone-800 rounded animate-pulse w-full" />
        <div className="h-4 bg-stone-800 rounded animate-pulse w-11/12" />
        <div className="h-4 bg-stone-800 rounded animate-pulse w-full" />
        <div className="h-4 bg-stone-800 rounded animate-pulse w-10/12" />
        <div className="h-4 bg-stone-800 rounded animate-pulse w-full" />
        <div className="h-4 bg-stone-800 rounded animate-pulse w-9/12" />
        <div className="h-4 bg-stone-800 rounded animate-pulse w-full" />
        <div className="h-4 bg-stone-800 rounded animate-pulse w-7/12" />
      </div>
    </Collapsible>
  );
}
