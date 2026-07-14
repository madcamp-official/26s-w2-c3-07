import { openai } from '../../config/openai.js';
import { env } from '../../config/env.js';
import { structuredInterrogationSchema } from './interrogation.schema.js';
import type { LlmGeneration } from './interrogation.types.js';

export class InterrogationLlmError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly providerCode: string | null
  ) {
    super(message);
    this.name = 'InterrogationLlmError';
  }
}

const schema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'dialectResponse', 'emotionAfter', 'evasionType', 'usedFactIds', 'revealedFactIds',
    'claimedFactIds', 'characterConsistencyStatus', 'validationNotes'
  ],
  properties: {
    dialectResponse: { type: 'string' },
    emotionAfter: { type: 'string', enum: ['CALM', 'NEUTRAL', 'NERVOUS', 'DEFENSIVE', 'ANGRY', 'FEARFUL', 'GUILTY', 'SAD', 'BREAKDOWN', 'MOCKING', 'AGGRESSIVE_DEFENSIVE'] },
    evasionType: { type: ['string', 'null'], enum: ['NONE', 'PARTIAL_ANSWER', 'DENIAL', 'DEFLECTION', 'UNKNOWN', 'PROMPT_REJECTION', null] },
    usedFactIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
    revealedFactIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
    claimedFactIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
    characterConsistencyStatus: { type: 'string', enum: ['valid', 'invalid'] },
    validationNotes: { type: 'array', items: { type: 'string' } }
  }
} as const;

const toLlmError = (error: unknown) => {
  const candidate = error as { message?: unknown; status?: unknown; code?: unknown };
  const message = typeof candidate?.message === 'string'
    ? candidate.message.replace(/(?:sk-|Bearer\s+)[A-Za-z0-9._-]+/g, '[redacted]').slice(0, 500)
    : 'Unknown OpenAI error';
  return new InterrogationLlmError(
    message || 'Unknown OpenAI error',
    typeof candidate?.status === 'number' ? candidate.status : null,
    typeof candidate?.code === 'string' ? candidate.code.slice(0, 100) : null
  );
};

export const interrogationLlm = {
  async generate(prompt: string): Promise<LlmGeneration> {
    const startedAt = Date.now();
    try {
      const completion = await openai.chat.completions.create({
        model: env.OPENAI_MODEL,
        temperature: 0.4,
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'interrogation_response', strict: true, schema }
        },
        messages: [{ role: 'user', content: prompt }]
      });
      const content = completion.choices[0]?.message.content;
      if (!content) throw new Error('LLM_EMPTY_RESPONSE');
      const parsed: unknown = JSON.parse(content);
      return {
        output: structuredInterrogationSchema.parse(parsed),
        provider: 'openai',
        model: completion.model || env.OPENAI_MODEL,
        inputTokens: completion.usage?.prompt_tokens ?? null,
        outputTokens: completion.usage?.completion_tokens ?? null,
        latencyMs: Date.now() - startedAt
      };
    } catch (error) {
      throw toLlmError(error);
    }
  }
};
