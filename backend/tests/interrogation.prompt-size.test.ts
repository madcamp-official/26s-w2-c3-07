import { describe, expect, it } from 'vitest';
import { selectDialectExpressions } from '../src/modules/interrogation/interrogation.knowledge.js';
import {
  buildInterrogationPrompt,
  estimatePromptTokens,
  FIXED_INTERROGATION_SYSTEM_PROMPT
} from '../src/modules/interrogation/interrogation.prompt.js';
import type { QuestionType, SuspectKnowledge } from '../src/modules/interrogation/interrogation.types.js';

const types: QuestionType[] = ['Q-TIME', 'Q-PLACE', 'Q-EVIDENCE', 'Q-CONTRADICTION', 'Q-ACCUSATION'];
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const paragraph = '사건 당시의 행동과 기억을 일관되게 설명하되 모르는 사실은 추측하지 않는다. '.repeat(12);

function fixture(type: QuestionType): SuspectKnowledge {
  const dialect = Array.from({ length: 60 }, (_, index) => ({
    code: `GS-MVP-${String(index).padStart(3, '0')}`,
    standardText: `표준 표현 ${index}`,
    dialectText: `사투리 표현 ${index}`,
    category: ['VOCABULARY', 'ENDING', 'FILLER', 'EMOTION', 'EVASION'][index % 5],
    intensity: (index % 3) + 1,
    questionTypes: [types[index % types.length]],
    emotionTags: [index % 2 ? 'NERVOUS' : 'NEUTRAL'],
    verificationStatus: index === 59 ? 'NEEDS_LINGUISTIC_REVIEW' : 'APPROVED_FOR_MVP'
  }));
  return {
    suspect: {
      id: uuid(1), name: '김용의', age: 45, occupation: '상인',
      personality: { summary: paragraph, temperament: paragraph, internalSecret: paragraph },
      speechStyle: { region: '경상도', baseTone: '경계하는 말투', honorificStyle: '반말', commonEndings: ['아이가', '데이'] },
      publicProfile: { biography: paragraph }
    },
    facts: Array.from({ length: 7 }, (_, index) => ({
      id: uuid(index + 10), code: `FACT-${index}`, content: `${type} 관련 허용 사실 ${index}: ${paragraph.slice(0, 180)}`,
      factType: index % 2 ? 'ALIBI' : 'OBSERVATION', disclosureLevel: 'ALLOWED'
    })),
    lies: Array.from({ length: 6 }, (_, index) => ({ claim: `주장 ${index} ${paragraph}`, truth: `진실 ${index} ${paragraph}` })),
    responseRules: [{
      ruleType: type, trigger: { keywords: paragraph },
      guidance: { guidance: paragraph, duplicatedCharacterPolicy: paragraph },
      allowedFactRefs: [uuid(10)], hiddenFactRefs: [uuid(99)]
    }],
    emotionRules: Array.from({ length: 6 }, () => ({ triggerType: 'QUESTION', trigger: { text: paragraph }, emotion: 'NERVOUS', intensity: 2 })),
    dialectExpressions: selectDialectExpressions(dialect, type, 'NEUTRAL', 'normal', 3),
    relationships: Array.from({ length: 5 }, (_, index) => ({ targetSuspectId: uuid(index + 100), relationshipType: '지인', publicDescription: paragraph })),
    previousMessages: Array.from({ length: 12 }, (_, index) => ({ question: `이전 질문 ${index} ${paragraph}`, response: `이전 답변 ${index} ${paragraph}` })),
    currentEmotion: 'NEUTRAL', difficulty: 'normal', dialectLevel: 3,
    revealedFactIds: [], claimedFactIds: [], knownEntities: ['종가', '마을회관', '피해자']
  };
}

function legacyPrompt(question: string, knowledge: SuspectKnowledge) {
  const allRules = Array.from({ length: 8 }, (_, index) => ({
    ...knowledge.responseRules[0], ruleType: index ? 'Q-OTHER' : knowledge.responseRules[0]?.ruleType
  }));
  return [
    '당신은 추리 게임의 용의자다. 아래 모든 설정과 규칙을 지켜 JSON으로 답하라.',
    JSON.stringify(knowledge.suspect), JSON.stringify(knowledge.facts), JSON.stringify(knowledge.lies),
    JSON.stringify(allRules), JSON.stringify(knowledge.emotionRules),
    JSON.stringify(knowledge.dialectExpressions), JSON.stringify(knowledge.relationships),
    JSON.stringify(knowledge.previousMessages), `질문: ${question}`
  ].join('\n');
}

describe('compact interrogation prompt budget', () => {
  it('stays below budget and reduces representative prompts by at least 60%', () => {
    const rows = types.map((type) => {
      const knowledge = fixture(type);
      const compact = buildInterrogationPrompt('사건 당시 어디에서 무엇을 했습니까?', type, knowledge, []);
      const legacyCharacters = legacyPrompt('사건 당시 어디에서 무엇을 했습니까?', knowledge).length;
      const legacyTokens = estimatePromptTokens(legacyCharacters);
      const reduction = 1 - compact.metrics.estimatedTokens / legacyTokens;
      expect(compact.metrics.estimatedTokens).toBeLessThanOrEqual(3500);
      expect(compact.metrics.includedHistoryCount).toBeLessThanOrEqual(3);
      expect(compact.metrics.includedRuleCount).toBe(1);
      expect(compact.metrics.includedDialectCount).toBeLessThanOrEqual(7);
      expect(compact.user).toContain('"key":"F1"');
      expect(compact.user).not.toContain(uuid(10));
      return {
        type, legacyCharacters, compactCharacters: compact.metrics.characterCount,
        legacyTokens, compactTokens: compact.metrics.estimatedTokens,
        reduction: Number((reduction * 100).toFixed(1)), facts: compact.metrics.includedFactCount,
        rules: compact.metrics.includedRuleCount, dialect: compact.metrics.includedDialectCount,
        history: compact.metrics.includedHistoryCount
      };
    });
    const averageReduction = rows.reduce((sum, row) => sum + row.reduction, 0) / rows.length;
    console.log(`PROMPT_BENCHMARK ${JSON.stringify(rows)}`);
    expect(averageReduction).toBeGreaterThanOrEqual(60);
    expect(FIXED_INTERROGATION_SYSTEM_PROMPT.length).toBeLessThan(500);
  });

  it('selects only approved dialect entries deterministically within difficulty and category caps', () => {
    const normal = fixture('Q-TIME').dialectExpressions;
    const again = fixture('Q-TIME').dialectExpressions;
    expect(normal).toEqual(again);
    expect(normal).toHaveLength(7);
    expect(normal.every((row) => row.verificationStatus === 'APPROVED_FOR_MVP')).toBe(true);
    expect(normal.filter((row) => row.category === 'VOCABULARY')).toHaveLength(2);
    expect(normal.filter((row) => row.category === 'ENDING')).toHaveLength(2);
    const pool = Array.from({ length: 30 }, (_, index) => ({
      ...normal[index % normal.length]!, code: `POOL-${index}`, category: `CUSTOM-${index}`
    }));
    expect(selectDialectExpressions(pool, 'Q-TIME', 'NEUTRAL', 'easy', 3)).toHaveLength(5);
    expect(selectDialectExpressions(pool, 'Q-TIME', 'NEUTRAL', 'normal', 3)).toHaveLength(7);
    expect(selectDialectExpressions(pool, 'Q-TIME', 'NEUTRAL', 'hard', 3)).toHaveLength(10);
  });

  it('keeps only the latest three history entries in chronological order', () => {
    const compact = buildInterrogationPrompt('어디였습니까?', 'Q-PLACE', fixture('Q-PLACE'), []);
    const payload = JSON.parse(compact.user) as { history: Array<{ q: string }> };
    expect(payload.history).toHaveLength(3);
    expect(payload.history.map((row) => row.q.match(/이전 질문 (\d+)/)?.[1])).toEqual(['9', '10', '11']);
    expect(compact.user).not.toContain('response_metadata');
  });
});
