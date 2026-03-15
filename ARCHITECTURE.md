# Architecture — Complete Technology Reference

**This Moment in History** — System Design & Technology Map
By Kenneth Benavides | MVP 10 | March 2026

---

## System Overview

This Moment in History is a full-stack AI storytelling application built on Next.js 16. A single streaming API endpoint coordinates two external services — Anthropic Claude for story generation and ElevenLabs for voice narration — and delivers both results to the browser over an NDJSON stream. The client renders stories immediately while audio is still generating on the server. Background music, cost estimation, and system-controlled UI choreography run entirely on the client with zero additional API calls.

---

## Technology Stack

Every dependency was chosen for a specific reason. This table covers the full stack.

### Runtime Dependencies

| Technology | Version | Purpose | Why This One |
|-----------|---------|---------|-------------|
| **Next.js** | 16.1.6 | Full-stack framework (App Router) | Server-side API routes protect API keys. File-based routing, streaming responses, and React Server Components in one deployable unit. No separate backend needed. |
| **React** | 19.2.3 | UI framework | Hooks-first architecture. `useRef` for timing accuracy in async code, `useCallback` for stable handler identity, `useEffect` for audio lifecycle. React 19's rendering pipeline handles frequent state updates during streaming without jank. |
| **react-dom** | 19.2.3 | React DOM renderer | Required by React for browser rendering. |
| **@anthropic-ai/sdk** | ^0.78.0 | Claude API client | Official TypeScript SDK with full type safety for `tool_use`, `tool_choice`, and structured message responses. |
| **react-day-picker** | ^9.14.0 | Calendar date picker | Lightweight, accessible, fully customizable. Dark theme applied via CSS class overrides. Future dates disabled with a single prop. |
| **date-fns** | ^4.1.0 | Date formatting | Tree-shakeable — only `format` is imported. No moment.js-sized bundle penalty. |

### Dev Dependencies

| Technology | Version | Purpose | Why This One |
|-----------|---------|---------|-------------|
| **TypeScript** | ^5 | Type safety | Type-safe API contracts between server and client. Catches `tool_use` response shape errors at compile time. |
| **Tailwind CSS** | ^4 | Utility-first styling | Zero context-switching between component and CSS files. The entire amber/stone dark theme is expressed in class names. |
| **@tailwindcss/postcss** | ^4 | PostCSS integration | Tailwind 4's build pipeline via PostCSS. |
| **Vitest** | ^4.1.0 | Test runner | Native TypeScript support, 2.5-second execution for 214 tests. `jsdom` environment for component tests without a real browser. |
| **@testing-library/react** | ^16.3.2 | Component testing | Tests user-visible behavior (text, clicks), not implementation details (state, CSS classes). |
| **@testing-library/jest-dom** | ^6.9.1 | DOM assertions | `toBeInTheDocument()`, `toHaveAttribute()`, and other DOM-specific matchers. |
| **@vitejs/plugin-react** | ^6.0.1 | React HMR for Vitest | Enables JSX transform and fast refresh in the test environment. |
| **jsdom** | ^28.1.0 | Browser simulation | Provides `window`, `document`, `Audio`, and DOM APIs for component tests. |
| **ESLint** | ^9 | Code linting | Catches common errors and enforces code style. |
| **eslint-config-next** | 16.1.6 | Next.js linting rules | Framework-specific rules for App Router, server components, and image optimization. |

### External Services (Not in package.json)

| Service | Model / Config | Purpose | Why This One |
|---------|---------------|---------|-------------|
| **Anthropic Claude API** | `claude-haiku-4-5-20251001` | Story generation | Follows complex multi-constraint prompts with high fidelity. `tool_use` forces structured JSON output in a single call. Haiku 4.5 delivers similar quality to Sonnet for 150-word vignettes at 1/3 the cost and 3-5x the speed. |
| **ElevenLabs TTS API** | `eleven_flash_v2_5`, Adam voice (`pNInz6obpgDQGcFmaJgB`) | Voice narration | Neural voice synthesis. Flash v2.5 generates audio in 5-8 seconds vs. 18+ seconds with multilingual model. Adam's deep, authoritative tone matches the literary journalism style. |
| **Vercel** | — | Hosting & deployment | Zero-config Next.js hosting. Automatic HTTPS, edge network, preview deployments. |

### Static Assets

| Asset | File | Purpose |
|-------|------|---------|
| **Background Music** | `public/audio/chronostream-runner.mp3` | Voyagers!-themed ambient soundtrack. Generated once via ElevenLabs Sound Effects, served as a static file — zero per-request cost. Loops at 12% volume with 2s fade-in and 3s fade-out. |

---

## Data Flow

The complete request lifecycle from user click to audio playback:

```
User clicks a date (or "Random History")
    |
    v
page.tsx: runPipeline(date, genre?)
    |
    |-- tts.cleanup()            // Destroy previous audio element + blob
    |-- bgMusic.stop()           // Hard stop previous music
    |-- tts.warmUp()             // Create Audio element (satisfies autoplay policy)
    |-- bgMusic.warmUp()         // Create bg Audio element (satisfies autoplay policy)
    |-- history.startLoading()   // Set loading state
    |-- setPhases([story, audio]) // Pick random themed loading messages
    |
    v
fetch('/api/pipeline', { month, day, genre? })
    |
    v
pipeline/route.ts (SERVER):
    |
    |-- rateLimit(ip)            // 10 req/IP/60s — reject with 429 if exceeded
    |-- validateRequest(body)    // month 1-12, day 1-31, genre in GENRES list
    |
    |-- Phase 1: Claude Haiku 4.5           [~3-4 seconds]
    |   |-- System prompt (400+ words) + tool_choice: publish_vignette
    |   |-- Returns: story, eventTitle, eventYear, mlaCitation
    |   |-- FLUSH: {"type":"story", ..., inputTokens, outputTokens}\n
    |
    |-- Phase 2: ElevenLabs Flash v2.5      [~5-8 seconds]
    |   |-- story + outro text --> POST to ElevenLabs API
    |   |-- Returns: audio bytes (MP3)
    |   |-- FLUSH: {"type":"audio", "audio":"<base64>", ttsCharacters}\n
    |
    v
page.tsx (CLIENT reads NDJSON stream):
    |
    |-- "story" event:
    |   |-- history.setResult()         // Display story text immediately
    |   |-- tts.setLoadingState(true)   // Show themed audio phase message
    |   |-- setCostData(tokens)         // Begin cost estimation
    |   |-- Update phase timers         // Show story generation time
    |
    |-- "audio" event:
    |   |-- Decode base64 --> Blob
    |   |-- tts.playBlob(blob)          // Auto-play narration
    |   |-- bgMusic.play()              // Fade in Voyagers! music (2s)
    |   |-- setCostData(chars)          // Complete cost estimation
    |   |-- Update phase timers         // Show audio generation time
    |
    v
User hears narration with background music.
    |-- LoadingState collapses (system-controlled)
    |-- StoryCard expands (system-controlled)
    |-- When narration ends: bgMusic.fadeOut() (3s fade)
    |-- Controls: Play/Pause, Replay, Download MP3, Mute Music, Random History
```

---

## API Endpoints

### POST `/api/pipeline` — Primary Streaming Endpoint

The main endpoint used in production. Handles story generation and TTS in a single streaming response.

**Request:**

```json
{
  "month": 3,
  "day": 14,
  "genre": "True Crime"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `month` | integer | Yes | 1-12 |
| `day` | integer | Yes | 1-31 |
| `genre` | string | No | Must match one of 20 curated genres exactly |

**Response:** `Content-Type: application/x-ndjson`

```
Line 1: {"type":"story","story":"...","eventTitle":"...","eventYear":"1945","mlaCitation":"...","date":{"month":3,"day":14},"genre":"True Crime","inputTokens":700,"outputTokens":295}
Line 2: {"type":"audio","audio":"SUQzBAAAAAAAI1RTU0UAAA...","ttsCharacters":1150}
```

**Error responses:**

| Status | Body | Cause |
|--------|------|-------|
| 400 | `{"error": "Invalid month"}` | Validation failure |
| 429 | `{"error": "Too many requests", "retryAfter": 45}` | Rate limit exceeded |
| 500 | `{"error": "API key not configured"}` | Missing env var |

### POST `/api/history` — Standalone Story Endpoint (Fallback)

Generates a story without TTS. Returns a standard JSON response (not streaming).

**Request:** Same as pipeline. **Response:** JSON with `story`, `eventTitle`, `eventYear`, `mlaCitation`, `genre`.

### POST `/api/tts` — Standalone TTS Endpoint (Fallback)

Converts text to speech. Returns raw audio bytes (`audio/mpeg`).

**Request:**

```json
{
  "text": "The air smells of...",
  "eventTitle": "The Fall of Berlin",
  "eventDate": "November 9",
  "eventYear": "1989"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `text` | string | Yes | Non-empty, max 5,000 characters |
| `eventTitle` | string | No | Appended to branding outro |
| `eventDate` | string | No | Appended to branding outro |
| `eventYear` | string | No | Appended to branding outro |

---

## Component Tree

```
<Home>  (page.tsx — client component, pipeline orchestrator)
  |
  |-- <CalendarPicker>                  Props: selectedDate, onDateSelect
  |     Uses: react-day-picker, date-fns
  |
  |-- <LoadingState>                    Props: phases[], pipelineStart, autoExpand, autoCollapse
  |     |-- <Collapsible locked>        System-controlled expand/collapse
  |     |     Header: phase label + live elapsed timer
  |     |     Body: phase list with timing + skeleton lines
  |     Persists in DOM once pipeline starts (never unmounted)
  |
  |-- <StoryCard>                       Props: story, date, eventTitle, eventYear, mlaCitation,
  |     |-- <Collapsible locked>              genre, audio controls, timing, autoExpand
  |     |     Header: date + event title + loading indicator
  |     |     Body: genre badge, event header, story text, MLA citation,
  |     |           audio controls (play/pause, replay, download),
  |     |           music toggle, timing label + cost estimate
  |     Persists in DOM once story arrives (never unmounted)
  |
  |-- Error display                     Conditional: only when history.error is set
  |
  |-- Empty state                       Conditional: no date selected, not loading
```

### Collapsible Component (Reusable)

The `<Collapsible>` component powers both LoadingState and StoryCard with two modes:

| Mode | Header | Expand/Collapse | Use Case |
|------|--------|----------------|----------|
| **Interactive** (default) | Clickable `<button>` with aria-expanded | User toggles via click | General-purpose accordion |
| **Locked** | Non-interactive `<div>` | System-controlled via `expanded` prop | LoadingState, StoryCard |

Animation uses measured `scrollHeight` for natural height transitions that work with dynamic content (live timers, varying story length).

---

## Hook Architecture

State is separated into three independent hooks. Each manages one concern and exposes a clean API to `page.tsx`.

### useHistoryStory — Story State

| Method | Purpose |
|--------|---------|
| `fetchStory(date, genre?)` | Standalone fetch to `/api/history` (fallback) |
| `startLoading()` | Set loading state for streaming pipeline |
| `setResult(data)` | Update story + metadata from pipeline stream |
| `setErrorState(msg)` | Set error and clear story |

**State:** `story`, `metadata` (eventTitle, eventYear, mlaCitation), `loading`, `error`, `activeGenre`

### useTextToSpeech — Narration Playback

| Method | Purpose |
|--------|---------|
| `warmUp()` | Create Audio element during user click (autoplay policy) |
| `playBlob(blob, options?)` | Play pre-fetched audio, fire onStart/onEnd callbacks |
| `speak(options)` | Fetch + play via `/api/tts` (fallback) |
| `togglePlayPause()` | Toggle, returns new playing state (avoids stale closure) |
| `replay()` | Reset to start, play, fire onStart |
| `cleanup()` | Destroy audio element, revoke blob URL, reset state |
| `download(filename?)` | Trigger browser download of current audio blob |
| `setLoadingState(bool)` | External control of loading indicator |

**State:** `loading`, `playing`, `paused`, `hasAudio`, `error`

**Key pattern — `handleEndedRef`:** The `ended` event handler is stored in a `useRef` to maintain stable function identity. Without this, `addEventListener` and `removeEventListener` receive different function references on each render, causing ghost listeners.

### useBackgroundMusic — Voyagers! Soundtrack

| Method | Purpose |
|--------|---------|
| `warmUp()` | Create Audio element during user click (autoplay policy) |
| `play()` | Start from beginning with 2s fade-in to 12% volume |
| `fadeOut()` | 3s fade from current volume to 0, then pause + reset |
| `stop()` | Immediate pause + reset (pipeline restart) |
| `pause()` / `resume()` | Sync with narrator play/pause |
| `toggleMute()` | Mute/unmute without starting or stopping playback |

**State:** `muted`

**Key pattern — asymmetric fade:** Fade-in is 2 seconds, fade-out is 3 seconds. This mirrors broadcast audio practice — listeners notice abrupt silence more than a slow swell.

---

## Key Design Patterns

| Pattern | Where Used | Why It Matters |
|---------|-----------|----------------|
| **NDJSON Streaming** | `/api/pipeline` → `page.tsx` | Story displays immediately while audio still generates on server. Two events over standard `fetch()` — no SSE, no WebSockets, no polyfills. |
| **warmUp()** | `useTextToSpeech`, `useBackgroundMusic` | Creates Audio elements synchronously during user click to satisfy browser autoplay policy. Without this, `audio.play()` is silently blocked when called from async callbacks. |
| **tool_use + tool_choice** | Claude API call in pipeline | Forces structured JSON output (story, title, year, citation) in a single call. Eliminates regex parsing, retry logic, and malformed JSON errors. |
| **useRef for handlers** | `handleEndedRef` in TTS hook | Stable function identity for `addEventListener`/`removeEventListener`. Prevents ghost event listeners across React re-renders. |
| **useRef for timing** | `phaseStartRef` in `page.tsx` | `useRef` provides synchronous reads inside async callbacks. `useState` would give stale values due to React's batched updates. |
| **Persistent DOM** | LoadingState, StoryCard | Cards mount once and stay in DOM. Expand/collapse controlled by props, not conditional rendering. Prevents Flash of Unmount when switching states. |
| **Locked Collapsible** | LoadingState, StoryCard headers | System controls visibility — users cannot toggle. Headers render as `<div>` instead of `<button>`. Prevents premature interaction before audio is ready. |
| **Asymmetric Fade** | Background music (2s in, 3s out) | Listeners notice silence more than swell. Longer fade-out creates a professional trail-off that mirrors broadcast audio production. |
| **Constraint Prompting** | System prompt for Claude | 400+ words defining what to do, what NOT to do, and how to verify quality. Anti-patterns section prevents encyclopedic defaults. Produces consistent output even with smaller models. |
| **Genre as Lens** | `buildUserMessage()` with genre | Genre shapes the story angle, not a database filter. Same date can yield 20 different stories. All historically accurate regardless of genre. |
| **Derived State** | `const expanded = autoExpand` | No internal useState for expand/collapse. Component state is directly derived from props. Eliminates sync bugs between parent and child state. |
| **Server-Side Overlap** | Pipeline route (story then TTS) | TTS fires immediately after Claude responds — zero client round-trip between phases. Saves 100-200ms plus architectural complexity. |

---

## Security Model

### API Key Protection

Both Anthropic and ElevenLabs keys are stored in `.env.local` (gitignored) and only accessed in server-side API routes (`src/app/api/`). The browser never sees the keys. The pipeline endpoint runs entirely on the server — the client receives only story text and audio bytes.

### Rate Limiting

In-memory rate limiter in `src/lib/rateLimit.ts`:

| Setting | Default | Configurable Via |
|---------|---------|-----------------|
| Max requests per IP | 10 | `RATE_LIMIT_MAX` env var |
| Window duration | 60 seconds | `RATE_LIMIT_WINDOW_MS` env var |
| Scope | Shared across all endpoints | — |
| Response | 429 with `retryAfter` in seconds | — |

### Input Validation

Every request is validated in `src/lib/validation.ts` before any external API call:

| Field | Rule |
|-------|------|
| `month` | Integer 1-12 |
| `day` | Integer 1-31 |
| `genre` | Must exactly match one of 20 curated genres (or omitted) |
| TTS `text` | Non-empty, max 5,000 characters |

### HTTP Security Headers

Deployed via `vercel.json`:

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forces HTTPS for 2 years |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `X-Frame-Options` | `DENY` | Blocks iframe embedding |
| `X-XSS-Protection` | `1; mode=block` | Browser XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer data leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables unused browser APIs |
| `Content-Security-Policy` | `default-src 'self'; connect-src 'self' https://api.anthropic.com` | Restricts resource loading |

---

## Cost Model

### Per-Request Breakdown

| Component | What It Costs | Typical Cost |
|-----------|--------------|-------------|
| **Claude Haiku 4.5** — input (~700 tokens) | $1.00 / 1M tokens | $0.0007 |
| **Claude Haiku 4.5** — output (~300 tokens) | $5.00 / 1M tokens | $0.0015 |
| **Claude total** | | **~$0.0022** |
| **ElevenLabs Flash v2.5** (~1,150 chars) | ~$0.11 / 1K chars (Creator plan) | **~$0.13** |
| **Background music** | Static asset | **$0.00** |
| **Total per story** | | **~$0.13** |

### Cost Drivers

- **ElevenLabs dominates cost** — TTS is ~98% of per-request spend
- **System prompt is fixed overhead** — ~640 of ~700 input tokens are identical every request. Anthropic's prompt caching can reduce this by 90%
- **Genre adds only ~50 tokens** — negligible cost impact
- **Shorter stories (150-200 words) save on both APIs** — fewer output tokens + fewer TTS characters

### Client-Side Cost Display

The pipeline returns `inputTokens`, `outputTokens`, and `ttsCharacters` in NDJSON events. `src/lib/costs.ts` calculates and formats the estimated cost, displayed in the StoryCard timing label.

---

## File Map

Every source file with its purpose:

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Main page — streaming pipeline orchestrator, state management, UI layout |
| `src/app/layout.tsx` | Root layout — Geist fonts, global metadata |
| `src/app/api/pipeline/route.ts` | Unified streaming endpoint — Claude story + ElevenLabs TTS in one NDJSON response |
| `src/app/api/history/route.ts` | Standalone story generation endpoint (fallback) |
| `src/app/api/tts/route.ts` | Standalone text-to-speech endpoint (fallback) |
| `src/components/CalendarPicker.tsx` | Date picker — react-day-picker with amber/stone dark theme |
| `src/components/Collapsible.tsx` | Reusable accordion — interactive or locked mode, measured scrollHeight animation |
| `src/components/LoadingState.tsx` | Multi-phase loading indicator — themed messages, live elapsed timers, locked Collapsible |
| `src/components/StoryCard.tsx` | Story display — genre badge, audio controls, MLA citation, timing + cost, locked Collapsible |
| `src/hooks/useBackgroundMusic.ts` | Voyagers! music — fade-in/out, warmUp, mute toggle, sync with narrator |
| `src/hooks/useHistoryStory.ts` | Story state — fetchStory (standalone), startLoading/setResult/setErrorState (pipeline) |
| `src/hooks/useTextToSpeech.ts` | TTS playback — warmUp, playBlob, speak, togglePlayPause, replay, download, cleanup |
| `src/lib/costs.ts` | Cost estimation — Claude token pricing + ElevenLabs character pricing |
| `src/lib/genres.ts` | 20 curated content genres + `getRandomGenre()` random selection |
| `src/lib/loadingMessages.ts` | Themed loading phase messages — archive theme + Voyagers! theme |
| `src/lib/prompts.ts` | Shared system prompt, `publish_vignette` tool definition, `STORY_MODEL` constant |
| `src/lib/rateLimit.ts` | In-memory rate limiter — per-IP tracking, configurable window and max |
| `src/lib/validation.ts` | Input validation — month, day, genre, monthName mapping, buildUserMessage |
| `public/audio/chronostream-runner.mp3` | Voyagers!-themed background music (static asset, loops during narration) |
| `vercel.json` | Security headers configuration (CSP, HSTS, X-Frame-Options, etc.) |
| `vitest.config.ts` | Test configuration — jsdom environment, path aliases, React plugin |
| `package.json` | Dependencies, scripts, pnpm packageManager declaration |
| `tsconfig.json` | TypeScript configuration — strict mode, path aliases |
| `next.config.ts` | Next.js configuration |
| `postcss.config.mjs` | PostCSS configuration for Tailwind CSS 4 |

### Test Files (13 files, 214 tests)

| File | Tests | What It Covers |
|------|-------|---------------|
| `useBackgroundMusic.test.ts` | 36 | Audio source, warmUp, fade-in/out timing, mute toggle, cleanup, page integration |
| `StoryCard.test.tsx` | 36 | Story rendering, audio controls, genre badge, download, music toggle, locked accordion |
| `Collapsible.test.tsx` | 20 | Interactive toggle, locked mode, aria attributes, chevron rotation, opacity transitions |
| `validation.test.ts` | 18 | Month/day/genre validation, monthName mapping, buildUserMessage construction |
| `ttsRoute.test.ts` | 16 | Voice ID (Adam), model (Flash v2.5), API URL, text validation, voice settings |
| `issueTwoRegression.test.ts` | 16 | Loading UX guards, pipeline config, architecture regression tests |
| `pipelineConfig.test.ts` | 16 | Pipeline models (Haiku + Flash), retired model guard, shared prompt content |
| `rateLimit.test.ts` | 15 | Allow/block logic, per-IP tracking, window reset, concurrent request handling |
| `LoadingState.test.tsx` | 14 | Phases, live timers, auto-expand/collapse, locked mode, themed messages |
| `costs.test.ts` | 12 | Cost calculation accuracy, formatting, edge cases, token/character pricing |
| `issueOneRegression.test.ts` | 10 | Architecture guards — warmUp, playBlob, pipeline helpers, handleEndedRef |
| `loadingMessages.test.ts` | 10 | Message array integrity, pickRandom distribution, Voyagers! theme messages |
| `genres.test.ts` | 5 | Genre list has 20 entries, all non-empty strings, getRandomGenre returns valid genre |

---

## Prompt Engineering

The Claude system prompt (`src/lib/prompts.ts`) is a 400+ word instruction set built with the Kajiro IQ Pro methodology. It uses constraint-based prompting with four sections:

| Section | Purpose | Key Rules |
|---------|---------|-----------|
| **Voice Rules** | Define the writing style | Second person, present tense, open with sensory detail, literary journalism |
| **Factual Integrity** | Ensure historical accuracy | Real events only, no invented details, no unverified speculation |
| **Structure** | Shape the narrative arc | One scene, build tension, resonant closing line, no moral lessons |
| **Anti-Patterns** | Prevent common AI defaults | No encyclopedic openings, no bullet points, no meta-commentary |

The `publish_vignette` tool schema forces Claude to return structured output:

| Field | Type | Description |
|-------|------|-------------|
| `story` | string | 150-200 word creative nonfiction vignette |
| `eventTitle` | string | Short title for the historical event |
| `eventYear` | string | Year the event occurred |
| `mlaCitation` | string | MLA 9th edition formatted citation |

`tool_choice: { type: 'tool', name: 'publish_vignette' }` guarantees the tool is always called — Claude cannot respond with plain text.

---

## Deployment

| Aspect | Configuration |
|--------|--------------|
| **Host** | Vercel |
| **Build** | `pnpm build` (Next.js production build) |
| **Environment** | `.env.local` with `ANTHROPIC_API_KEY` and `ELEVENLABS_API_KEY` |
| **Domain** | Configured in Vercel dashboard |
| **CI/CD** | Git push to `main` triggers automatic deployment |
| **Branch protection** | `main` and `prod` require PRs; `dev` allows direct push |
| **Package manager** | pnpm 10.32.1 (declared in `package.json` `packageManager` field) |

---

*Built with Kajiro IQ Pro | Kenneth Benavides | https://kajiro.org*
