import '@testing-library/jest-dom/vitest';

// Polyfill ResizeObserver for jsdom (not available in test environment).
// Used by Collapsible component to track dynamic content height changes.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof globalThis.ResizeObserver;
}
