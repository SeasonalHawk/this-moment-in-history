# This Moment in History

An AI-powered creative nonfiction storytelling app with voice narration. Pick any calendar date and receive a vivid 150-200 word historical vignette — not a Wikipedia summary, but an immersive second-person narrative that drops you into the moment. Audio narration auto-generates with Voyagers!-themed background music for an immersive documentary-style experience.

## How It Works

1. **Pick a date** from the calendar
2. **Read** the AI-generated creative nonfiction vignette
3. **Listen** — narration auto-generates with Adam's voice and Voyagers!-themed accompaniment
4. **Control** — Play/Pause, Replay, Download MP3, Mute Music
5. **Discover** — click "Random History" for a genre-themed story from a random date
6. **Download** the audio as an MP3 (includes branding outro)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| AI Storytelling | Anthropic Claude API (`claude-haiku-4-5-20251001`) |
| Voice Narration | ElevenLabs TTS API (Adam voice, Flash v2.5) |
| Background Music | Voyagers!-themed ambient soundtrack (Chronostream Runner, static asset) |
| Calendar | react-day-picker, date-fns |
| Testing | Vitest, React Testing Library |
| Prompt Framework | Kajiro IQ Pro |
| Deployment | Vercel |

## Quick Start

```bash
git clone https://github.com/SeasonalHawk/this-moment-in-history.git
cd this-moment-in-history
pnpm install
```

Create `.env.local` with your API keys:

```env
ANTHROPIC_API_KEY=your-anthropic-key
ELEVENLABS_API_KEY=your-elevenlabs-key
```

Start the dev server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
this-moment-in-history/
├── public/
│   └── audio/
│       └── chronostream-runner.mp3   # Voyagers!-themed background music (static asset)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── history/route.ts      # Story generation endpoint (standalone fallback)
│   │   │   ├── pipeline/route.ts     # Unified streaming pipeline (story + TTS, NDJSON)
│   │   │   └── tts/route.ts          # Text-to-speech endpoint (standalone fallback)
│   │   ├── layout.tsx                # Root layout (Geist fonts)
│   │   └── page.tsx                  # Main page — streaming pipeline orchestrator
│   ├── components/
│   │   ├── CalendarPicker.tsx         # Date picker (react-day-picker, amber theme)
│   │   ├── Collapsible.tsx            # Reusable accordion with locked (system-controlled) mode
│   │   ├── LoadingState.tsx           # Multi-phase loading indicator with live timers
│   │   └── StoryCard.tsx              # Story display + audio controls + timing + cost estimate
│   ├── hooks/
│   │   ├── useBackgroundMusic.ts      # Voyagers! music — fade-in/out, warmUp, mute toggle
│   │   ├── useHistoryStory.ts         # Story state + pipeline helpers (startLoading, setResult)
│   │   └── useTextToSpeech.ts         # TTS playback, warmUp, playBlob, download, lifecycle
│   ├── lib/
│   │   ├── costs.ts                   # Per-request cost estimation (Claude + ElevenLabs)
│   │   ├── genres.ts                  # 20 content genres + random selection
│   │   ├── loadingMessages.ts         # Themed loading phase messages (archive + Voyagers!)
│   │   ├── prompts.ts                 # Shared system prompt + tool definition
│   │   ├── rateLimit.ts               # In-memory rate limiter (10 req/IP/60s)
│   │   └── validation.ts             # Input validation (month, day, genre)
│   └── __tests__/
│       ├── Collapsible.test.tsx        # 20 tests — accordion, locked mode, aria, chevron, opacity
│       ├── costs.test.ts              # 12 tests — cost calculation, formatting, edge cases
│       ├── genres.test.ts             # 5 tests — genre list integrity, random selection
│       ├── issueOneRegression.test.ts # 10 tests — architecture guards for critical patterns
│       ├── issueTwoRegression.test.ts # 16 tests — loading UX guards, pipeline config
│       ├── loadingMessages.test.ts    # 10 tests — themed message arrays, pickRandom
│       ├── LoadingState.test.tsx      # 14 tests — phases, timers, auto-expand/collapse, locked
│       ├── pipelineConfig.test.ts     # 16 tests — pipeline models (Haiku + Flash), shared prompt
│       ├── rateLimit.test.ts          # 15 tests — allow/block, per-IP tracking, window reset
│       ├── StoryCard.test.tsx         # 36 tests — rendering, audio, genre, controls, accordion
│       ├── ttsRoute.test.ts           # 16 tests — TTS validation, voice config (Flash v2.5)
│       ├── useBackgroundMusic.test.ts # 36 tests — audio source, warmUp, fade-in/out, cleanup
│       └── validation.test.ts         # 18 tests — input validation, monthName, buildUserMessage
├── .env.local                         # API keys (gitignored)
├── vercel.json                        # Security headers (CSP, HSTS, X-Frame-Options)
├── vitest.config.ts                   # Test configuration
└── package.json
```

## MVP Releases

### MVP 1 — Core Story Engine (March 13, 2026)

The foundation: pick a date, get a story.

- Calendar date picker with amber/stone dark theme
- AI-generated creative nonfiction vignettes (200-300 words)
- Second-person, present-tense immersive storytelling
- "Spin Your Luck" button for alternate stories on the same date
- Event title, year, and MLA 9th edition citation with every story
- Server-side API key protection
- In-memory rate limiting (10 req/IP/60s)
- Input validation (month 1-12, day 1-31, spin 0-50)
- Security headers via vercel.json
- 33 unit tests passing

### MVP 2 — Voice Narration (March 14, 2026)

Added "Read to Me" — hear the story narrated aloud.

- ElevenLabs TTS integration with Adam voice (deep, authoritative narrator)
- "Read to Me" button with loading/playing/stopped states
- Auto-play after audio loads
- "Stop Reading" button to halt narration
- Audio auto-stops when picking a new date or spinning
- Download button — save narration as MP3
- Narration ending reads: event title, date, year, then branding outro
- Branding: "This audio is created by This Moment in History. Copyright 2026."
- Download filename includes event title (e.g., `this-moment-in-history-the-fall-of-the-berlin-wall.mp3`)
- 54 tests passing

### MVP 3 — Background Music (March 14, 2026)

Added subtle ambient music that plays during narration.

- Dreamscape piano loop generated via ElevenLabs Sound Effects API
- Saved as static asset (`public/audio/ambient-bg.mp3`) — zero per-request cost
- Plays at 10% volume — subtle, non-intrusive
- Music starts when narrator begins, stops when narrator stops
- Mute toggle button (music note icon with strikethrough when muted)
- Mute only affects volume — does not start or stop playback independently
- 61 tests passing

### MVP 4 — Random History (March 14, 2026)

Added genre-based discovery — explore history through thematic lenses.

- "Random History" button replaces "Spin Your Luck" — picks a random date and genre
- 20 curated content genres: True Crime, Espionage & Spies, War & Military, Science & Discovery, Love & Romance, Betrayal & Revenge, Survival & Exploration, Rise & Fall of Empires, Innovation & Invention, Art & Culture, Sports & Competition, Natural Disasters, Revolution & Rebellion, Medicine & Plague, Money & Economics, Religion & Faith, Women Who Changed History, Unsolved Mysteries, Food & Cuisine, Conspiracy & Mystery
- Genre used as thematic lens for AI story generation via Kajiro IQ Pro prompting
- Genre badge displayed on story card
- Genre validation on server-side
- 70 tests passing

### MVP 5 — Auto-TTS Pipeline (March 14, 2026)

Seamless audio experience — narration auto-generates as part of the story pipeline.

- Auto-generate TTS audio immediately after story loads (no manual button click)
- Multi-phase loading states: "Uncovering history..." then "Finding our history professor..."
- Play/Pause toggle replaces the old "Read to Me" / "Stop Reading" buttons
- Replay button to restart narration from the beginning
- Background music fade-in (0 to 15% volume over 2 seconds)
- Background music pauses/resumes in sync with narrator play/pause
- Full audio state reset on date change and Random History click
- Reduced Claude API max_tokens from 2048 to 1024 for faster response times
- fetchStory() returns data directly for zero-delay TTS trigger
- Removed manual "Read to Me" button — audio is now fully automatic
- 74 tests passing

### MVP 6 — Autoplay Fix + Pipeline Timing (March 14, 2026)

Fixed browser autoplay policy and added real-time performance feedback.

- `warmUp()` pattern — creates Audio element synchronously during user click to satisfy browser autoplay policy, then reuses it for TTS playback after async API calls complete
- Real-time elapsed timer during both loading phases (updates every 100ms)
- Pipeline timing breakdown on story card: "Story Xs · Audio Ys · Total Zs"
- `phaseStartRef` uses `useRef` (not state) for synchronous timing accuracy in async code
- Timing resets on every new date selection or Random History click
- 78 tests passing

### MVP 7 — Efficiency Review (March 14, 2026)

Code quality pass — removed dead code, fixed bugs, optimized performance.

- Fixed `handleEnded` identity bug — converted to `useRef` for stable `addEventListener`/`removeEventListener` identity
- Removed dead `audioPaused` prop from StoryCard (accepted but never used in rendering)
- Added defensive `URL.revokeObjectURL` guard in `speak()` to prevent blob memory leaks
- Removed redundant `cleanup()` call inside `warmUp()` (callers already call cleanup)
- Extracted `runPipeline()` to unify `handleDateSelect` and `handleRandomHistory` flows
- Moved `formatMs` to module scope (was recreated every render)
- Switched ElevenLabs model from `eleven_multilingual_v2` to `eleven_turbo_v2_5`
- Set ElevenLabs `style: 0` to reduce TTS latency
- Reduced Claude `max_tokens` from 1024 to 512
- 78 tests passing (8 files changed, 62 insertions, 90 deletions)

### MVP 8 — Streaming Pipeline + Speed Optimization (March 14, 2026)

3x faster pipeline — unified streaming endpoint with faster AI models.

- **Unified `/api/pipeline` endpoint** — single NDJSON streaming request handles both story generation and TTS audio, eliminating client round-trip between phases
- **Server-side overlap** — TTS generation fires immediately after story completes on the server, without waiting for story data to reach the client first
- **Claude Haiku model** (`claude-haiku-4-5-20251001`) — ~3-5x faster story generation vs Sonnet
- **ElevenLabs Flash model** (`eleven_flash_v2_5`) — fastest available TTS model, lowest latency
- **Shorter vignettes** (150-200 words vs 200-300) — less text = faster TTS generation
- **NDJSON streaming** — client reads story and audio as separate lines; story displays immediately while TTS still generates
- **Shared prompt module** (`src/lib/prompts.ts`) — system prompt and tool definition extracted to shared module, eliminating duplication between `/api/history` and `/api/pipeline`
- **`playBlob()` method** on `useTextToSpeech` — plays pre-fetched audio blobs directly, bypassing the standalone `/api/tts` fetch
- **`setLoadingState()` method** on `useTextToSpeech` — allows pipeline orchestrator to control TTS loading indicator during server-side audio generation
- **Pipeline helpers** on `useHistoryStory` — `startLoading()`, `setResult()`, `setErrorState()` enable streaming pipeline to update story state without calling `fetchStory()`
- Standalone `/api/history` and `/api/tts` endpoints kept as fallbacks
- Previous pipeline: Story ~13s (Sonnet) + Audio ~18.5s (Turbo) = ~31.4s sequential
- Target pipeline: Story ~3-4s (Haiku) + Audio ~5-8s (Flash) = ~8-12s with server overlap
- 94 tests passing

### MVP 9 — Voyagers! Music + Autoplay Fix (March 15, 2026)

Replaced ambient music with Voyagers!-themed soundtrack and fixed audio reliability.

- Replaced dreamscape piano with **Chronostream Runner** — a Voyagers!-themed ambient track
- Fixed browser autoplay silence with `warmUp()` pattern for background music (mirrors TTS warmUp)
- Professional **fade-in (2s) / fade-out (3s)** with asymmetric durations — mirrors broadcast audio practice
- Reduced volume to 12% for the fuller orchestral track
- Background music fades out gracefully after narration copyright outro finishes
- Themed loading messages: archive/scroll phase ("Searching the archives...") and Voyagers! phase ("The Omni is locked on...")
- Per-request cost estimation displayed on story card (Claude input/output tokens + ElevenLabs characters)
- 209 tests passing

### MVP 10 — System-Controlled Collapsible Accordion (March 15, 2026)

Cards persist in DOM — system choreographs expand/collapse for a polished UX.

- Reusable `<Collapsible>` component with `locked` mode — system-controlled expand/collapse, no user toggle
- LoadingState and StoryCard **persist in DOM permanently** — no more conditional unmount/remount
- LoadingState auto-expands during pipeline processing, auto-collapses when narration starts
- StoryCard auto-expands when narration begins playing
- Non-interactive headers with animated chevron indicator (rotates on state change)
- Smooth `maxHeight` + opacity transitions via measured `scrollHeight`
- Cards stay visible as collapsed headers even when not active
- 214 tests passing

## API Token Costs

Every request to the app makes two API calls: one to Anthropic (story generation) and one to ElevenLabs (voice narration). Here's the full cost breakdown.

### Per-Request Token Breakdown (Claude Haiku 4.5)

The Claude API call uses `tool_use` with `tool_choice`, which means input includes the system prompt, tool definition, and user message — and output is the structured tool response.

| Component | Tokens | Type | Notes |
|-----------|--------|------|-------|
| System prompt | ~425 | Input (fixed) | Voice rules, factual integrity, anti-patterns |
| Tool definition (`publish_vignette`) | ~215 | Input (fixed) | 4-field JSON schema with descriptions |
| User message (no genre) | ~29 | Input (variable) | "Write a vignette about [Month] [Day]" |
| User message (with genre) | ~78 | Input (variable) | +49 tokens for genre lens instructions |
| **Total input** | **~670-720** | | ~640 tokens are fixed overhead |
| Story text (150-200 words) | ~200-270 | Output | ~1 token per word |
| Metadata (title, year, citation) | ~35-50 | Output | Structured tool fields |
| **Total output** | **~250-340** | | Bounded by `max_tokens: 512` |
| **Total per request** | **~920-1,060** | | ~70% input, ~30% output |

### Per-Request Cost (Claude Haiku 4.5)

| Metric | Rate | Cost |
|--------|------|------|
| Input tokens (~700) | $1.00 / 1M tokens | $0.0007 |
| Output tokens (~300) | $5.00 / 1M tokens | $0.0015 |
| **Claude total per request** | | **~$0.0022** |
| With prompt caching (repeated system prompt) | $0.10 / 1M cached input | **~$0.0015** |

### Per-Request Cost (ElevenLabs Flash v2.5)

| Metric | Value |
|--------|-------|
| Story text | ~900-1,200 characters |
| Outro (title, date, branding) | ~100-150 characters |
| **Total characters per TTS call** | **~1,000-1,350** |
| Flash v2.5 credit rate | 0.5 credits per character |
| **Credits consumed** | **~500-675** |

ElevenLabs pricing varies by plan:

| Plan | Monthly | Included Chars | Cost per 1K chars (Flash) | Per-request cost |
|------|---------|---------------|--------------------------|-----------------|
| Starter | $5/mo | 20K | ~$0.08 | ~$0.08-0.11 |
| Creator | $22/mo | 60K | ~$0.11 | ~$0.11-0.15 |
| Pro | $99/mo | 200K | ~$0.10 | ~$0.10-0.14 |
| Scale | $330/mo | 1M | ~$0.08 | ~$0.08-0.11 |

### Total Cost Per Story (Combined)

| Scenario | Claude | ElevenLabs | Total |
|----------|--------|-----------|-------|
| Single story (Pro plan) | $0.002 | ~$0.12 | **~$0.12** |
| Single story (Scale plan) | $0.002 | ~$0.09 | **~$0.09** |
| 100 stories/month (Pro plan) | $0.22 | ~$12.00 | **~$12.22** |
| 1,000 stories/month (Scale plan) | $2.20 | ~$90.00 | **~$92.20** |

### Key Takeaways

- **ElevenLabs dominates cost** — TTS is ~98% of per-request spend. Claude story generation is essentially free by comparison.
- **System prompt is fixed overhead** — ~640 of ~700 input tokens are the same every request. Anthropic's prompt caching can reduce this by 90%.
- **`tool_use` adds ~215 tokens** — but eliminates the need for retry logic, regex parsing, or output validation. The reliability tradeoff is worth the token cost.
- **Genre adds only ~50 tokens** — negligible cost impact for dramatically different stories.
- **Shorter stories (150-200 words) save on both APIs** — fewer output tokens from Claude AND fewer characters to ElevenLabs.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key from console.anthropic.com |
| `ELEVENLABS_API_KEY` | Yes | ElevenLabs API key (needs `text_to_speech` permission) |
| `RATE_LIMIT_MAX` | No | Max requests per IP per window (default: 10) |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window in ms (default: 60000) |

## Security

- Both API keys are server-side only — never exposed to the browser
- Rate limiting prevents abuse (10 req/IP/min, shared across endpoints)
- Security headers configured in vercel.json (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- `.env.local` is gitignored — keys never enter version control
- TTS text input capped at 5,000 characters

## Testing

```bash
pnpm test          # Run all 214+ tests
pnpm test:watch    # Watch mode
```

| Test File | Tests | Coverage |
|-----------|-------|----------|
| useBackgroundMusic.test.ts | 36 | Audio source, warmUp, fade-in/out, mute, cleanup, page integration |
| StoryCard.test.tsx | 36 | Rendering, audio controls, genre badge, download, music toggle, accordion |
| Collapsible.test.tsx | 20 | Accordion toggle, locked mode, aria attrs, chevron rotation, opacity |
| validation.test.ts | 18 | Input validation, monthName, buildUserMessage, genre validation |
| ttsRoute.test.ts | 16 | TTS validation, voice config (Flash v2.5), voice settings |
| issueTwoRegression.test.ts | 16 | Loading UX guards, pipeline config, architecture regression |
| pipelineConfig.test.ts | 16 | Pipeline models (Haiku 4.5 + Flash), retired model guard, shared prompt |
| rateLimit.test.ts | 15 | Allow/block, per-IP tracking, window reset, concurrent requests |
| LoadingState.test.tsx | 14 | Phases, live timers, auto-expand/collapse, locked mode, custom messages |
| costs.test.ts | 12 | Cost calculation, formatting, edge cases, token/char pricing |
| issueOneRegression.test.ts | 10 | Critical architecture guards (warmUp, playBlob, pipeline helpers) |
| loadingMessages.test.ts | 10 | Themed message arrays, pickRandom, Voyagers! messages |
| genres.test.ts | 5 | Genre list integrity, random selection |

## The Story Behind the Build

This project started as a portfolio build challenge: go from zero to deployed in a 3-day sprint, following a structured build guide. What was estimated to take 8-11 hours across 3 days was completed in two evening sessions (~6 hours total) using Claude Code and the Kajiro IQ Pro prompt optimization framework.

The core idea: history doesn't have to read like a textbook. Every date has a story worth telling — not as a list of facts, but as a moment you can feel. The AI system prompt enforces literary journalism rules: sensory details, real people, real places, present tense, second person. No "On this day in..." openings. No Wikipedia summaries. Just immersive storytelling grounded in fact.

MVP 2 and MVP 3 elevated the experience from reading to listening — adding voice narration and ambient music turned a text app into something closer to an audio documentary experience, all generated on demand. MVP 4 added genre-based discovery, MVP 5 made the entire audio pipeline automatic, MVP 6 fixed browser autoplay compliance and added real-time pipeline performance metrics, MVP 7 cleaned up code quality and fixed bugs, and MVP 8 introduced a unified streaming pipeline with faster AI models to cut total generation time from ~31s to ~8-12s.

MVP 9 brought the Voyagers!-themed Chronostream Runner soundtrack with professional fade-in/fade-out, and MVP 10 added system-controlled collapsible accordion sections — the LoadingState and StoryCard now persist in the DOM permanently with choreographed expand/collapse transitions, preventing premature button clicks before audio is ready.

## Build Timeline

| Metric | Build Guide Estimate | Actual |
|--------|---------------------|--------|
| Total timeline | 3 days (8-11 hrs) | 3 evening sessions |
| MVP 1 complete | Day 1-2 | March 13, 2026 (3.5 hrs) |
| MVP 2 + MVP 3 complete | — | March 14, 2026 (1.5 hrs) |
| MVP 4 + MVP 5 + MVP 6 complete | — | March 14, 2026 (same session) |
| MVP 7 + MVP 8 complete | — | March 14, 2026 (same session) |
| MVP 9 + MVP 10 complete | — | March 15, 2026 |
| Total time | 8-11 hrs | ~8 hrs |
| Built with | — | Claude Code + Kajiro IQ Pro |

## License

MIT

---

*Built with Kajiro IQ Pro | Powered by Anthropic Claude + ElevenLabs | Kenneth Benavides*
