import { readFileSync } from 'node:fs';

const model = process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it:free';
const basePrompt = readFileSync(new URL('../prompts/system.md', import.meta.url), 'utf8');

export async function generateReply(history, profileName) {
  const system = profileName
    ? `${basePrompt}\n\nLa persona con la que hablás se llama ${profileName}.`
    : basePrompt;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      messages: [{ role: 'system', content: system }, ...history],
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`OpenRouter ${res.status}: ${data.error?.message ?? 'sin detalle'}`);
  }
  return data.choices[0].message.content.trim();
}
