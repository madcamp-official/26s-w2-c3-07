import { describe, expect, it } from 'vitest';
import { createInterrogationSchema, structuredInterrogationSchema } from '../src/modules/interrogation/interrogation.schema.js';

const id = '00000000-0000-4000-8000-000000000001';
const structured = {
  dialectResponse: '그때 별장에 있었수다.', emotionAfter: 'NERVOUS', evasionType: null,
  usedFactIds: [id], revealedFactIds: [id], claimedFactIds: [id],
  characterConsistencyStatus: 'valid', validationNotes: []
};

describe('interrogation request and provider schemas', () => {
  it('accepts the complete strict structured response', () => {
    expect(structuredInterrogationSchema.safeParse(structured).success).toBe(true);
  });

  it('blocks malformed provider JSON with missing fact arrays', () => {
    const { revealedFactIds: _revealed, ...malformed } = structured;
    expect(structuredInterrogationSchema.safeParse(malformed).success).toBe(false);
  });

  it('blocks unknown provider fields', () => {
    expect(structuredInterrogationSchema.safeParse({ ...structured, culpritId: id }).success).toBe(false);
  });

  it('normalizes duplicate evidence ids in a valid request', () => {
    const result = createInterrogationSchema.parse({ requestId: id, suspectId: id, question: '증거를 봤습니까?', presentedEvidenceIds: [id, id] });
    expect(result.presentedEvidenceIds).toEqual([id]);
  });

  it('rejects more than three presented evidence ids', () => {
    const ids = [1, 2, 3, 4].map((value) => `00000000-0000-4000-8000-00000000000${value}`);
    expect(createInterrogationSchema.safeParse({ requestId: id, suspectId: id, question: '증거를 봤습니까?', presentedEvidenceIds: ids }).success).toBe(false);
  });
});
