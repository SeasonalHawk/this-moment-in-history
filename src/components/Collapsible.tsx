'use client';

import { useRef, useEffect, useState } from 'react';

interface CollapsibleProps {
  /** Whether the content is currently expanded */
  expanded: boolean;
  /** Toggle callback — fired on header click or keyboard Enter/Space */
  onToggle?: () => void;
  /** Always-visible header content (rendered inside a clickable button) */
  header: React.ReactNode;
  /** Collapsible body content */
  children: React.ReactNode;
  /** Unique ID for aria-controls linkage */
  id: string;
  /** Optional class for the outer container */
  className?: string;
  /** When true, the header is not clickable — expand/collapse is system-controlled only */
  locked?: boolean;
}

/**
 * Accessible collapsible section with smooth height + opacity animation.
 *
 * Uses measured scrollHeight for natural height transitions — works with
 * dynamic content that may change size while expanded.
 */
export default function Collapsible({
  expanded,
  onToggle,
  header,
  children,
  id,
  className = '',
  locked = false,
}: CollapsibleProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const headerId = `${id}-header`;

  // Re-measure content height when expanded state changes so the
  // maxHeight animation target stays accurate. Uses ResizeObserver
  // to track dynamic content changes (e.g. live timers) without
  // triggering a re-render loop.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    setMeasuredHeight(el.scrollHeight);

    const observer = new ResizeObserver(() => {
      setMeasuredHeight(el.scrollHeight);
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [expanded]);

  return (
    <div className={className}>
      {/* Header — always visible. When locked, not interactive (system-controlled). */}
      {locked ? (
        <div id={headerId} className="w-full flex items-center gap-2 select-none text-left">
          {/* Chevron indicator (animated but not clickable) */}
          <svg
            className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-200 ${
              expanded ? 'rotate-90' : 'rotate-0'
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <div className="flex-1 min-w-0">{header}</div>
        </div>
      ) : (
        <button
          id={headerId}
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={onToggle}
          className="w-full flex items-center gap-2 cursor-pointer select-none text-left"
        >
          {/* Chevron indicator */}
          <svg
            className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-200 ${
              expanded ? 'rotate-90' : 'rotate-0'
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <div className="flex-1 min-w-0">{header}</div>
        </button>
      )}

      {/* Animated content region */}
      <div
        id={id}
        ref={contentRef}
        role="region"
        aria-labelledby={headerId}
        style={{
          maxHeight: expanded ? `${measuredHeight}px` : '0px',
          opacity: expanded ? 1 : 0,
        }}
        className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
      >
        {children}
      </div>
    </div>
  );
}
