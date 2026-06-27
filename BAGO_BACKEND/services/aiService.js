import Anthropic from '@anthropic-ai/sdk';

let _client = null;

function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export async function askClaude({ system, messages, model = 'claude-haiku-4-5', maxTokens = 1024 }) {
  const msg = await getClient().messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages,
  });
  return msg.content[0]?.text ?? '';
}

export function isAiEnabled() {
  return !!process.env.ANTHROPIC_API_KEY;
}
