import { describe, expect, it } from 'vitest';
import { analyzeQuestion, validateQuestionTarget } from '../src/modules/interrogation/interrogation.question.js';
import type { StructuredInterrogationResponse, SuspectKnowledge } from '../src/modules/interrogation/interrogation.types.js';

const speakerId = '00000000-0000-4000-8000-000000000001';
const dohyunId = '00000000-0000-4000-8000-000000000002';
const malsunId = '00000000-0000-4000-8000-000000000003';

const knowledge = (previousMessages: SuspectKnowledge['previousMessages'] = []): SuspectKnowledge => ({
  suspect: { id: speakerId, name: '이순임', age: 58, occupation: '종부', personality: {}, speechStyle: {}, publicProfile: {} },
  facts: [], lies: [], responseRules: [], effectiveRuleType: 'Q-RELATION', emotionRules: [], dialectExpressions: [],
  relationships: [], publicRelationships: [], previousMessages, currentEmotion: 'NEUTRAL', difficulty: 'normal', dialectLevel: 2,
  revealedFactIds: [], claimedFactIds: [], knownEntities: ['이순임', '김도현', '박말순', '김재현'],
  characters: [
    { id: speakerId, code: 'GS-01-S1', name: '이순임', occupation: '종부·김재현의 아내', victimRelation: '피해자의 아내' },
    { id: dohyunId, code: 'GS-01-S2', name: '김도현', occupation: '둘째아들', victimRelation: '피해자의 둘째 아들' },
    { id: malsunId, code: 'GS-01-S3', name: '박말순', occupation: '행랑어멈', victimRelation: '오랜 고용인' }
  ],
  victim: { id: '00000000-0000-4000-8000-000000000004', name: '김재현' }
});

const response = (dialectResponse: string): StructuredInterrogationResponse => ({
  dialectResponse, emotionAfter: 'NEUTRAL', evasionType: 'NONE', usedFactIds: [], revealedFactIds: [], claimedFactIds: [],
  characterConsistencyStatus: 'valid', validationNotes: []
});

describe('target-aware interrogation questions', () => {
  it('separates the speaker from another suspect in a victim relationship question', () => {
    const analysis = analyzeQuestion('김도현은 피해자와 어떤 관계야?', 'Q-RELATION', knowledge());
    expect(analysis).toMatchObject({ speakerId, subjectId: dohyunId, objectType: 'VICTIM', intent: 'ASK_RELATIONSHIP', isCaseRelated: true });
    expect(validateQuestionTarget(response('김도현은 피해자의 둘째 아들입니다.'), analysis, knowledge())).toEqual([]);
    expect(validateQuestionTarget(response('저는 피해자의 아내입니다.'), analysis, knowledge())).toContain('QUESTION_TARGET_MISMATCH');
  });

  it('treats another suspect alibi as case-related', () => {
    expect(analyzeQuestion('김도현은 사건 당일 어디에 있었어?', 'Q-PLACE', knowledge()))
      .toMatchObject({ subjectId: dohyunId, intent: 'ASK_ALIBI', isCaseRelated: true, needsClarification: false });
  });

  it('keeps two explicitly named suspects as relationship subject and object', () => {
    expect(analyzeQuestion('박말순과 이순임은 어떤 사이야?', 'Q-RELATION', knowledge()))
      .toMatchObject({ subjectId: malsunId, objectType: 'SUSPECT', objectId: speakerId, needsClarification: false });
  });

  it('asks for clarification when a pronoun has no prior referent', () => {
    expect(analyzeQuestion('그 사람은 피해자와 어떤 관계야?', 'Q-RELATION', knowledge()))
      .toMatchObject({ subjectId: null, intent: 'AMBIGUOUS', needsClarification: true });
  });

  it('resolves a pronoun to the last explicitly mentioned character', () => {
    const context = knowledge([{ question: '김도현을 마지막으로 본 게 언제야?', response: '저녁 무렵입니다.' }]);
    expect(analyzeQuestion('그 사람은 왜 피해자와 싸웠어?', 'Q-MOTIVE', context))
      .toMatchObject({ subjectId: dohyunId, needsClarification: false });
  });

  it('keeps the current speaker for a self relationship question and rejects weather as off-topic', () => {
    expect(analyzeQuestion('당신은 피해자와 어떤 관계야?', 'Q-RELATION', knowledge())).toMatchObject({ subjectId: speakerId });
    expect(analyzeQuestion('오늘 날씨 어때?', 'Q-SMALLTALK', knowledge())).toMatchObject({ intent: 'OFF_TOPIC', isCaseRelated: false });
  });
});
