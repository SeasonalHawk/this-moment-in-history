const Anthropic = require('@anthropic-ai/sdk');
const { buildSystemPrompt, buildUserMessage } = require('./_prompts');
const { validateRequest } = require('./_validate');
const { rateLimit } = require('./_rateLimit');

const client = new Anthropic();

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { allowed, retryAfter } = rateLimit(req);
  if (!allowed) {
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({ error: 'Too many requests', retryAfter });
  }

  const { valid, error, data } = validateRequest(req.body);
  if (!valid) {
    return res.status(400).json({ error });
  }

  const { month, day, spin } = data;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: buildSystemPrompt(),
      messages: [
        { role: 'user', content: buildUserMessage(month, day, spin) }
      ]
    });

    const story = message.content[0]?.text || '';

    return res.status(200).json({
      story,
      date: { month, day },
      spin
    });
  } catch (err) {
    console.error('Claude API error:', err.message);

    if (err.status === 401) {
      return res.status(500).json({ error: 'API configuration error' });
    }

    return res.status(502).json({ error: 'Failed to generate story' });
  }
};
