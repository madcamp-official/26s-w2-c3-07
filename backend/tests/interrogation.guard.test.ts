import { describe, expect, it } from 'vitest';
import { classifyQuestion, selectPromptFacts } from '../src/modules/interrogation/interrogation.guard.js';
import type { PromptFact, SuspectKnowledge } from '../src/modules/interrogation/interrogation.types.js';

const fact = (id: string, factType: string, disclosureLevel = 'LLM_ALLOWED', content = id): PromptFact => ({
  id, code: id, content, factType, disclosureLevel
});

const knowledge = (facts: PromptFact[]): SuspectKnowledge => ({
  suspect: { id: 's', name: '용의자', age: 40, occupation: '상인', personality: {}, speechStyle: {}, publicProfile: {} },
  facts, lies: [], emotionRules: [], dialectExpressions: [], relationships: [], previousMessages: [],
  responseRules: [{ ruleType: 'Q-EVIDENCE', trigger: {}, guidance: {}, allowedFactRefs: ['allowed'], hiddenFactRefs: ['hidden'] }],
  effectiveRuleType: 'Q-EVIDENCE',
  currentEmotion: 'NEUTRAL', difficulty: 'normal', dialectLevel: 2,
  revealedFactIds: ['revealed'], claimedFactIds: [], knownEntities: []
});

describe('interrogation fact selection', () => {
  it.each([
    '문틀의 혈흔은 어떻게 생긴 겁니까?',
    '이 피자국은 몸싸움 때문에 생긴 겁니까?',
    '문틀에 피가 묻은 이유가 뭡니까?',
    '긁힌 자국에 대해 설명해 보세요.',
    '부검 결과는 알고 있었습니까?'
  ])('classifies evidence wording: %s', (question) => {
    expect(classifyQuestion(question)).toBe('Q-EVIDENCE');
  });

  it('does not confuse 피해자 with a blood-evidence question', () => {
    expect(classifyQuestion('피해자와 어떤 관계입니까?')).toBe('Q-RELATION');
  });

  it('prioritizes explicit, evidence-linked, revealed, and relevant facts within the question limit', () => {
    const facts = [
      fact('allowed', 'KNOWN'),
      fact('evidence', 'KNOWN', 'LLM_ALLOWED', '깨진 전용 찻잔을 보았다.'),
      fact('revealed', 'KNOWN'),
      fact('relevant', 'EVIDENCE'),
      fact('fallback', 'PHYSICAL'),
      fact('extra-1', 'EVIDENCE'), fact('extra-2', 'EVIDENCE'), fact('extra-3', 'EVIDENCE')
    ];
    const selected = selectPromptFacts(knowledge(facts), 'Q-EVIDENCE', [{
      id: 'e1', code: 'E1', title: '전용 찻잔', description: '깨진 찻잔', evidenceType: 'PHYSICAL'
    }]);
    expect(selected.map((row) => row.id).slice(0, 3)).toEqual(['allowed', 'evidence', 'revealed']);
    expect(selected).toHaveLength(7);
  });

  it('never includes hidden or SERVER_ONLY facts even when referenced by a rule', () => {
    const selected = selectPromptFacts(knowledge([
      fact('hidden', 'EVIDENCE'), fact('server', 'EVIDENCE', 'SERVER_ONLY'), fact('allowed', 'KNOWN')
    ]), 'Q-EVIDENCE');
    expect(selected.map((row) => row.id)).toEqual(['allowed']);
  });

  it('includes LLM_HIDDEN only when the effective rule explicitly allows it', () => {
    const hidden = fact('blood-fact', 'EVIDENCE', 'LLM_HIDDEN', '문틀 혈흔은 몸싸움에서 생겼다.');
    const base = knowledge([hidden]);
    expect(selectPromptFacts(base, 'Q-MOTIVE', [{ id: 'e1', code: 'E1', title: '문틀 혈흔', description: '핏자국', evidenceType: 'PHYSICAL' }])).toEqual([]);
    const allowed = { ...base, responseRules: [{ ...base.responseRules[0]!, allowedFactRefs: ['blood-fact'], hiddenFactRefs: [] }] };
    expect(selectPromptFacts(allowed, 'Q-EVIDENCE').map((row) => row.id)).toEqual(['blood-fact']);
  });

  it('limits ordinary questions to five relevant facts', () => {
    const selected = selectPromptFacts(knowledge(Array.from({ length: 8 }, (_, index) => fact(`time-${index}`, 'TIME'))), 'Q-TIME');
    expect(selected).toHaveLength(5);
  });
});
