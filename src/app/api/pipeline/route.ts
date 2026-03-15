import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { validateRequest, buildUserMessage, monthName } from '@/lib/validation';
import { rateLimit } from '@/lib/rateLimit';
import { HISTORY_SYSTEM_PROMPT, VIGNETTE_TOOL, STORY_MODEL } from '@/lib/prompts';

const ELEVENLABS_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam
const ELEVENLABS_MODEL = 'eleven_flash_v2_5'; // Fastest English model
const BRANDING_OUTRO = 'This audio is created by This Moment in History. Copyright 2026.';

/**
 * Unified streaming pipeline: story generation → TTS → NDJSON response.
 *
 * Response format (newline-delimited JSON):
 *   {"type":"story", "story":"...", "eventTitle":"...", ...}\n
 *   {"type":"audio", "audio":"<base64>"}\n
 *
 * The story line is flushed immediately so the client can display it
 * while TTS is still generating on the server (server-side overlap).
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  const { allowed, retryAfter } = rateLimit(ip);
  if (!allowed) {
    return Response.json({ error: 'Too many requests', retryAfter }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const result = validateRequest(body);
  if (!result.valid) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  const { month, day, genre } = result.data;

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const elevenlabsKey = process.env.ELEVENLABS_API_KEY;

  if (!anthropicKey) {
    return Response.json({ error: 'API key not configured' }, { status: 500 });
  }
  if (!elevenlabsKey) {
    return Response.json({ error: 'TTS API key not configured' }, { status: 500 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // ── Phase 1: Generate story with Claude Haiku 4.5 ──────────────
        const client = new Anthropic({ apiKey: anthropicKey });
        const message = await client.messages.create({
          model: STORY_MODEL,
          max_tokens: 512,
          system: HISTORY_SYSTEM_PROMPT,
          tools: [VIGNETTE_TOOL],
          tool_choice: { type: 'tool' as const, name: 'publish_vignette' },
          messages: [
            { role: 'user', content: buildUserMessage(month, day, genre ?? undefined) }
          ]
        });

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

        // Flush story data immediately — client can display while TTS generates
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'story',
          story: input.story,
          eventTitle: input.eventTitle || null,
          eventYear: input.eventYear || null,
          mlaCitation: input.mlaCitation || null,
          date: { month, day },
          genre: genre || null,
          // Token usage for cost estimation (Issue #2)
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
        }) + '\n'));

        // ── Phase 2: Generate TTS with ElevenLabs Flash ────────────
        const eventDate = `${monthName(month)} ${day}`;
        let outro = '\n\n';
        if (input.eventTitle) outro += `${input.eventTitle}. `;
        if (eventDate && input.eventYear) {
          outro += `${eventDate}, ${input.eventYear}. `;
        } else if (eventDate) {
          outro += `${eventDate}. `;
        }
        outro += `\n\n${BRANDING_OUTRO}`;

        const fullText = input.story + outro;

        const ttsResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'xi-api-key': elevenlabsKey,
            },
            body: JSON.stringify({
              text: fullText,
              model_id: ELEVENLABS_MODEL,
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0,
              },
            }),
          }
        );

        if (!ttsResponse.ok) {
          const errorText = await ttsResponse.text().catch(() => 'Unknown error');
          console.error('ElevenLabs API error:', ttsResponse.status, errorText);
          throw new Error('Failed to generate audio');
        }

        const audioBuffer = await ttsResponse.arrayBuffer();
        const base64Audio = Buffer.from(audioBuffer).toString('base64');

        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'audio',
          audio: base64Audio,
          // Character count for cost estimation (Issue #2)
          ttsCharacters: fullText.length,
        }) + '\n'));

      } catch (err: unknown) {
        const error = err as { status?: number; message?: string };
        console.error('Pipeline error:', error.message);
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'error',
          error: error.message || 'Pipeline failed',
        }) + '\n'));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
