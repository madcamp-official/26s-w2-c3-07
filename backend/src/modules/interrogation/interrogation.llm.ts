import { openai } from '../../config/openai.js';
import { structuredInterrogationSchema } from './interrogation.schema.js';
import type { LlmGeneration } from './interrogation.types.js';

const MODEL = 'gpt-4o-mini';

export const interrogationLlm = {
  async generate(prompt: string): Promise<LlmGeneration> {
    const startedAt = Date.now();
    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }]
    });
    const content = completion.choices[0]?.message.content;
    if (!content) throw new Error('LLM_EMPTY_RESPONSE');
    const parsed: unknown = JSON.parse(content);
    return {
      output: structuredInterrogationSchema.parse(parsed),
      model: completion.model || MODEL,
      inputTokens: completion.usage?.prompt_tokens ?? null,
      outputTokens: completion.usage?.completion_tokens ?? null,
      latencyMs: Date.now() - startedAt
    };
  }
};
