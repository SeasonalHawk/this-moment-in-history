import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { validateRequest, buildUserMessage } from '@/lib/validation';
import { rateLimit } from '@/lib/rateLimit';

const SYSTEM_PROMPT = `You are a creative nonfiction storyteller specializing in vivid historical narratives. Your task is to write immersive 200–300 word vignettes about real historical events.

VOICE RULES:
- Write in second person ("you") to place the reader inside the moment
- Use present tense to create immediacy
- Open with a sensory detail — a sound, a smell, a texture, a shift in light. NEVER open with "On this day" or any encyclopedic framing
- Write like literary journalism: every fact is real, but the prose reads like fiction
- Include at least two specific sensory details (sight, sound, smell, touch, taste)
- Name real people, real places, and real details when available

FACTUAL INTEGRITY:
- Every event, date, person, and location must be historically accurate
- Do not invent events. If multiple events occurred on the given date, choose the most compelling one
- Do not speculate about thoughts or dialogue unless sourced from historical record
- If a date has no widely known event, find an obscure but verified one — there is always something

STRUCTURE:
- One single scene, one moment in time — not a timeline or list
- Build tension or wonder in the middle
- End with a resonant closing line — an image, an irony, or a quiet echo of significance
- No moral lessons, no "and that's why this matters" endings

ANTI-PATTERNS (never do these):
- No "On this day in [year]..." openings
- No Wikipedia-style summaries
- No bullet points or lists
- No meta-commentary about the writing
- No fictional embellishments beyond atmospheric scene-setting

You will be asked to use a tool to publish your vignette along with its metadata (event title, year, and MLA citation). Always use the tool.`;

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  const { allowed, retryAfter } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests', retryAfter }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const result = validateRequest(body);

  if (!result.valid) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { month, day, spin } = result.data;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: [{
        name: 'publish_vignette',
        description: 'Publish a historical vignette with its metadata. You MUST call this tool with your completed vignette.',
        input_schema: {
          type: 'object' as const,
          properties: {
            story: {
              type: 'string',
              description: 'The full creative nonfiction vignette text (200-300 words)'
            },
            eventTitle: {
              type: 'string',
              description: 'A short title for the historical event (e.g., "The Fall of the Berlin Wall")'
            },
            eventYear: {
              type: 'string',
              description: 'The year the event took place (e.g., "1989")'
            },
            mlaCitation: {
              type: 'string',
              description: 'One MLA 9th edition formatted citation for a reputable source'
            }
          },
          required: ['story', 'eventTitle', 'eventYear', 'mlaCitation']
        }
      }],
      tool_choice: { type: 'tool' as const, name: 'publish_vignette' },
      messages: [
        { role: 'user', content: buildUserMessage(month, day, spin) }
      ]
    });

    // Extract tool use result
    const toolBlock = message.content.find(b => b.type === 'tool_use');
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      throw new Error('No tool response received');
    }

    const input = toolBlock.input as {
      story: string;
      eventTitle: string;
      eventYear: string;
      mlaCitation: string;
    };

    return NextResponse.json({
      story: input.story,
      eventTitle: input.eventTitle || null,
      eventYear: input.eventYear || null,
      mlaCitation: input.mlaCitation || null,
      date: { month, day },
      spin
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    console.error('Claude API error:', error.message);

    if (error.status === 401) {
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 });
    }

    return NextResponse.json({ error: 'Failed to generate story' }, { status: 502 });
  }
}
