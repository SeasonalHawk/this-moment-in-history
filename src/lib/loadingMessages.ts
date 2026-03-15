/**
 * Themed loading messages for each pipeline phase.
 *
 * Phase 1 (story generation): archive / discovery theme
 * Phase 2 (audio narration): Voyagers!-inspired time-travel adventure theme
 *
 * Future: each message will be paired with a pre-generated Midjourney image
 * stored in public/loading/ (Phase 2 of Issue #2).
 */

export const STORY_PHASE_MESSAGES = [
  'Searching the archives...',
  'Consulting the scrolls...',
  'Dusting off the records...',
  'Decoding an ancient manuscript...',
  'Opening the vault of forgotten stories...',
];

export const AUDIO_PHASE_MESSAGES = [
  'The Omni is locked on — engaging time coordinates...',
  'Firing up the time machine...',
  'The pilot is charting a course through history...',
  'Calibrating the temporal compass...',
  'Spinning up the portal — adventure awaits...',
  'The green light is flashing — history needs us...',
];

/** Pick a random element from a non-empty array. */
export function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
