import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

const ELEVENLABS_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam — deep, authoritative male narrator
const ELEVENLABS_MODEL = 'eleven_multilingual_v2';
const BRANDING_OUTRO = 'This audio is created by This Moment in History. Copyright 2026.';

export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  const { allowed, retryAfter } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests', retryAfter }, { status: 429 });
  }

  // Parse and validate body
  const body = await request.json().catch(() => null);

  if (!body || typeof body.text !== 'string' || body.text.trim().length === 0) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  if (body.text.length > 5000) {
    return NextResponse.json({ error: 'text must be 5000 characters or fewer' }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'TTS API key not configured' }, { status: 500 });
  }

  // Build the full narration: story → title, date, year → branding
  const eventTitle = typeof body.eventTitle === 'string' ? body.eventTitle : '';
  const eventDate = typeof body.eventDate === 'string' ? body.eventDate : '';
  const eventYear = typeof body.eventYear === 'string' ? body.eventYear : '';

  let outro = '\n\n';
  if (eventTitle) {
    outro += `${eventTitle}. `;
  }
  if (eventDate && eventYear) {
    outro += `${eventDate}, ${eventYear}. `;
  } else if (eventDate) {
    outro += `${eventDate}. `;
  } else if (eventYear) {
    outro += `${eventYear}. `;
  }
  outro += `\n\n${BRANDING_OUTRO}`;

  const fullText = body.text + outro;

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: fullText,
          model_id: ELEVENLABS_MODEL,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.4,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('ElevenLabs API error:', response.status, errorText);

      if (response.status === 401) {
        return NextResponse.json({ error: 'TTS API configuration error' }, { status: 500 });
      }

      return NextResponse.json({ error: 'Failed to generate audio' }, { status: 502 });
    }

    // Stream the audio bytes back to the client
    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error('TTS error:', error.message);
    return NextResponse.json({ error: 'Failed to generate audio' }, { status: 502 });
  }
}
