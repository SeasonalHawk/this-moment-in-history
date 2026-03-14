'use client';

export default function LoadingState() {
  return (
    <div className="bg-stone-900 border border-stone-700 rounded-xl p-6 shadow-lg max-w-2xl mx-auto">
      {/* Quill icon + message */}
      <div className="flex items-center gap-3 mb-6">
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
        <span className="text-amber-400 font-medium animate-pulse">
          Uncovering history...
        </span>
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
    </div>
  );
}
