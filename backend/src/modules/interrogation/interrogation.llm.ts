import { openai } from '../../config/openai.js';
import { env } from '../../config/env.js';
import { compactInterrogationOutputSchema } from './interrogation.schema.js';
import type { InterrogationPrompt, LlmGeneration, StructuredInterrogationResponse } from './interrogation.types.js';

export class InterrogationLlmError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly providerCode: string | null,
    readonly retryable: boolean,
    readonly inputTokens: number | null = null,
    readonly outputTokens: number | null = null,
    readonly cachedTokens: number | null = null,
    readonly latencyMs: number | null = null
  ) {
    super(message);
    this.name = 'InterrogationLlmError';
  }
}

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['response', 'emotion', 'evasion', 'usedFacts', 'revealedFacts', 'claimedFacts'],
  properties: {
    response: { type: 'string', maxLength: 120 },
    emotion: { type: 'string', enum: ['CALM', 'NEUTRAL', 'NERVOUS', 'DEFENSIVE', 'ANGRY', 'FEARFUL', 'GUILTY', 'SAD', 'BREAKDOWN', 'MOCKING', 'AGGRESSIVE_DEFENSIVE'] },
    evasion: { type: ['string', 'null'], enum: ['NONE', 'PARTIAL_ANSWER', 'DENIAL', 'DEFLECTION', 'UNKNOWN', 'PROMPT_REJECTION', null] },
    usedFacts: { description: 'Fact keys actually used and reflected in the final response.', type: 'array', items: { type: 'string', pattern: '^F[1-9]\\d*$' }, maxItems: 7 },
    revealedFacts: { description: 'Previously undisclosed fact keys clearly newly revealed in this response.', type: 'array', items: { type: 'string', pattern: '^F[1-9]\\d*$' }, maxItems: 7 },
    claimedFacts: { description: 'Fact keys asserted by the NPC as a claim or alibi, regardless of truth.', type: 'array', items: { type: 'string', pattern: '^F[1-9]\\d*$' }, maxItems: 7 }
  }
} as const;

const retryableProviderCode = (code: string | null) => Boolean(code && /timeout|rate_limit|connection|server_error/i.test(code));

const toLlmError = (error: unknown) => {
  if (error instanceof InterrogationLlmError) return error;
  const candidate = error as { message?: unknown; status?: unknown; code?: unknown };
  const message = typeof candidate?.message === 'string'
    ? candidate.message.replace(/(?:sk-|Bearer\s+)[A-Za-z0-9._-]+/g, '[redacted]').slice(0, 500)
    : 'Unknown OpenAI error';
  const status = typeof candidate?.status === 'number' ? candidate.status : null;
  const providerCode = typeof candidate?.code === 'string' ? candidate.code.slice(0, 100) : null;
  const retryable = status === 408 || status === 429 || Boolean(status && status >= 500)
    || retryableProviderCode(providerCode)
    || /JSON|parse|structured output|empty response/i.test(message);
  return new InterrogationLlmError(message || 'Unknown OpenAI error', status, providerCode, retryable);
};

function mapFactKeys(keys: string[], factKeyToId: Record<string, string>): string[] {
  const unique = [...new Set(keys)];
  return unique.map((key) => {
    const id = factKeyToId[key];
    if (!id) throw new InterrogationLlmError(`UNKNOWN_FACT_KEY:${key}`, null, 'unknown_fact_key', false);
    return id;
  });
}

export const interrogationLlm = {
  async generate(prompt: InterrogationPrompt): Promise<LlmGeneration> {
    const startedAt = Date.now();
    let usage: { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number | null } } | undefined;
    try {
      const completion = await openai.chat.completions.create({
        model: env.OPENAI_MODEL,
        temperature: 0.4,
        max_tokens: 300,
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'compact_interrogation_response', strict: true, schema }
        },
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user }
        ]
      });
      usage = completion.usage;
      const content = completion.choices[0]?.message.content;
      if (!content) throw new Error('LLM_EMPTY_RESPONSE');
      const compact = compactInterrogationOutputSchema.parse(JSON.parse(content));
      const output: StructuredInterrogationResponse = {
        dialectResponse: compact.response,
        emotionAfter: compact.emotion,
        evasionType: compact.evasion,
        usedFactIds: mapFactKeys(compact.usedFacts, prompt.factKeyToId),
        revealedFactIds: mapFactKeys(compact.revealedFacts, prompt.factKeyToId),
        claimedFactIds: mapFactKeys(compact.claimedFacts, prompt.factKeyToId),
        characterConsistencyStatus: 'valid',
        validationNotes: []
      };
      return {
        output,
        provider: 'openai',
        model: completion.model || env.OPENAI_MODEL,
        inputTokens: completion.usage?.prompt_tokens ?? null,
        outputTokens: completion.usage?.completion_tokens ?? null,
        cachedTokens: completion.usage?.prompt_tokens_details?.cached_tokens ?? null,
        latencyMs: Date.now() - startedAt
      };
    } catch (error) {
      const normalized = toLlmError(error);
      throw new InterrogationLlmError(
        normalized.message, normalized.status, normalized.providerCode, normalized.retryable,
        usage?.prompt_tokens ?? normalized.inputTokens,
        usage?.completion_tokens ?? normalized.outputTokens,
        usage?.prompt_tokens_details?.cached_tokens ?? normalized.cachedTokens,
        Date.now() - startedAt
      );
    }
  }
};
