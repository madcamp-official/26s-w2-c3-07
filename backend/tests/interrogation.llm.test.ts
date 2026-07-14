import { afterEach, describe, expect, it, vi } from 'vitest';
import { openai } from '../src/config/openai.js';
import { InterrogationLlmError, interrogationLlm } from '../src/modules/interrogation/interrogation.llm.js';
import type { InterrogationPrompt } from '../src/modules/interrogation/interrogation.types.js';

const factId = '00000000-0000-4000-8000-000000000001';
const prompt: InterrogationPrompt = {
  system: 'fixed system', user: '{"question":"어디였습니까?"}', factKeyToId: { F1: factId },
  metrics: { promptVersion: 'test', characterCount: 50, estimatedTokens: 25, includedFactCount: 1, includedRuleCount: 1, includedDialectCount: 1, includedHistoryCount: 0 }
};

function completion(content: Record<string, unknown>) {
  return {
    id: 'chatcmpl-test', object: 'chat.completion', created: 1, model: 'gpt-4o-mini-test',
    choices: [{ index: 0, finish_reason: 'stop', logprobs: null, message: { role: 'assistant', refusal: null, content: JSON.stringify(content) } }],
    usage: { prompt_tokens: 120, completion_tokens: 20, total_tokens: 140, prompt_tokens_details: { cached_tokens: 80 } }
  };
}

const output = {
  response: '그때 별장에 있었수다.', emotion: 'NERVOUS', evasion: null,
  usedFacts: ['F1', 'F1'], revealedFacts: ['F1'], claimedFacts: []
};

describe('interrogation LLM adapter', () => {
  afterEach(() => vi.restoreAllMocks());

  it('uses fixed-first messages, bounded output, short keys, and cached token accounting', async () => {
    const create = vi.spyOn(openai.chat.completions, 'create').mockResolvedValue(completion(output) as never);
    const result = await interrogationLlm.generate(prompt);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      max_tokens: 300,
      messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }]
    }));
    expect(result.output.usedFactIds).toEqual([factId]);
    expect(result.output.revealedFactIds).toEqual([factId]);
    expect(result.cachedTokens).toBe(80);
    expect(result.inputTokens).toBe(120);
  });

  it('rejects a fact key that was not included without retrying it', async () => {
    vi.spyOn(openai.chat.completions, 'create').mockResolvedValue(completion({ ...output, usedFacts: ['F9'] }) as never);
    await expect(interrogationLlm.generate(prompt)).rejects.toMatchObject<Partial<InterrogationLlmError>>({
      providerCode: 'unknown_fact_key', retryable: false
    });
  });
});
