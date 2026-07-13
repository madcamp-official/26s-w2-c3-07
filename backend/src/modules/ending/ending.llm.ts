import { z } from 'zod';
import { openai } from '../../config/openai.js';
import type { EndingReportGeneration } from './ending.types.js';

const MODEL = 'gpt-4o-mini';

export const endingReportSchema = z.object({
  reportText: z.string().min(1).max(10000),
  aftermathText: z.string().min(1).max(10000)
}).strict();

export const endingLlm = {
  async generate(prompt: string): Promise<EndingReportGeneration> {
    const startedAt = Date.now();
    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'investigation_report',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              reportText: { type: 'string' },
              aftermathText: { type: 'string' }
            },
            required: ['reportText', 'aftermathText'],
            additionalProperties: false
          }
        }
      },
      messages: [{ role: 'user', content: prompt }]
    });
    const content = completion.choices[0]?.message.content;
    if (!content) throw new Error('ENDING_REPORT_EMPTY');
    return {
      output: endingReportSchema.parse(JSON.parse(content) as unknown),
      model: completion.model || MODEL,
      inputTokens: completion.usage?.prompt_tokens ?? null,
      outputTokens: completion.usage?.completion_tokens ?? null,
      latencyMs: Date.now() - startedAt
    };
  }
};
