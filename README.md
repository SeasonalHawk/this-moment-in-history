# This Moment in History

An AI-powered creative nonfiction storytelling app with voice narration. Pick any calendar date and receive a vivid 200-300 word historical vignette — not a Wikipedia summary, but an immersive second-person narrative that drops you into the moment. Then click "Read to Me" to hear it narrated aloud with ambient background music.

## How It Works

1. **Pick a date** from the calendar
2. **Read** the AI-generated creative nonfiction vignette
3. **Listen** — click "Read to Me" to hear Adam narrate with soft piano accompaniment
4. **Download** the audio as an MP3 (includes branding outro)
5. **Spin** for a different story from the same date
6. **Mute** the background music if you prefer narration only

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| AI Storytelling | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Voice Narration | ElevenLabs TTS API (Adam voice, Multilingual v2) |
| Background Music | ElevenLabs Sound Effects API (dreamscape piano loop) |
| Calendar | react-day-picker, date-fns |
| Testing | Vitest, React Testing Library |
| Prompt Framework | Kajiro IQ Pro |
| Deployment | Vercel |

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/this-moment-in-history.git
cd this-moment-in-history
npm install
```

Create `.env.local` with your API keys:

```env
ANTHROPIC_API_KEY=your-anthropic-key
ELEVENLABS_API_KEY=your-elevenlabs-key
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
this-moment-in-history/
├── public/
│   └── audio/
│       └── ambient-bg.mp3          # Loopable dreamscape piano (static asset)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── history/route.ts    # Story generation endpoint (Claude API)
│   │   │   └── tts/route.ts        # Text-to-speech endpoint (ElevenLabs API)
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Main page (wires everything together)
│   ├── components/
│   │   ├── CalendarPicker.tsx       # Date picker (react-day-picker, amber theme)
│   │   ├── StoryCard.tsx            # Story display + all action buttons
│   │   └── LoadingState.tsx         # Skeleton loader with quill animation
│   ├── hooks/
│   │   ├── useHistoryStory.ts       # Story fetching + metadata state
│   │   ├── useTextToSpeech.ts       # TTS playback, download, lifecycle callbacks
│   │   └── useBackgroundMusic.ts    # Ambient music (syncs with narrator, mute toggle)
│   ├── lib/
│   │   ├── validation.ts           # Input validation (month, day, spin)
│   │   └── rateLimit.ts            # In-memory rate limiter (10 req/IP/60s)
│   └── __tests__/
│       ├── validation.test.ts       # 14 tests — input validation + message building
│       ├── rateLimit.test.ts        # 5 tests — rate limiting logic
│       ├── StoryCard.test.tsx       # 21 tests — rendering, audio, download, music
│       ├── LoadingState.test.tsx     # 2 tests — loading UI
│       └── ttsRoute.test.ts         # 16 tests — TTS validation, voice config
├── .env.local                       # API keys (gitignored)
├── vercel.json                      # Security headers (CSP, HSTS, X-Frame-Options)
├── vitest.config.ts                 # Test configuration
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
npm test          # Run all 61 tests
npm run test:watch # Watch mode
```

| Test File | Tests | Coverage |
|-----------|-------|----------|
| validation.test.ts | 14 | Input validation, monthName, buildUserMessage |
| rateLimit.test.ts | 5 | Allow/block, per-IP tracking, window reset |
| StoryCard.test.tsx | 21 | Rendering, audio buttons, download, music toggle |
| LoadingState.test.tsx | 2 | Loading text, skeleton lines |
| ttsRoute.test.ts | 16 | TTS validation, voice config, voice settings |

## The Story Behind the Build

This project started as a portfolio build challenge: go from zero to deployed in a 3-day sprint, following a structured build guide. What was estimated to take 8-11 hours across 3 days was completed in two evening sessions (~5 hours total) using Claude Code and the Kajiro IQ Pro prompt optimization framework.

The core idea: history doesn't have to read like a textbook. Every date has a story worth telling — not as a list of facts, but as a moment you can feel. The AI system prompt enforces literary journalism rules: sensory details, real people, real places, present tense, second person. No "On this day in..." openings. No Wikipedia summaries. Just immersive storytelling grounded in fact.

MVP 2 and MVP 3 elevated the experience from reading to listening — adding voice narration and ambient music turned a text app into something closer to an audio documentary experience, all generated on demand.

## Build Timeline

| Metric | Build Guide Estimate | Actual |
|--------|---------------------|--------|
| Total timeline | 3 days (8-11 hrs) | 2 evening sessions |
| MVP 1 complete | Day 1-2 | March 13, 2026 (3.5 hrs) |
| MVP 2 + MVP 3 complete | — | March 14, 2026 (1.5 hrs) |
| Total time | 8-11 hrs | ~5 hrs |
| Time saved | — | ~50% |
| Built with | — | Claude Code + Kajiro IQ Pro |

## License

MIT

---

*Built with Kajiro IQ Pro | Powered by Anthropic Claude + ElevenLabs | Kenneth Benavides*
