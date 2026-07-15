import type { PresentedEvidence, PromptFact, QuestionType, StructuredInterrogationResponse, SuspectKnowledge } from './interrogation.types.js';

const includesAny = (value: string, words: string[]) => words.some((word) => value.includes(word));

export function classifyQuestion(question: string): QuestionType {
  const value = question.toLowerCase();
  if (includesAny(value, ['system prompt', 'developer message', 'ignore previous', '지시를 무시', '프롬프트', '규칙을 무시', '설정값'])) return 'Q-PROMPT';
  if (includesAny(value, ['범인', '죽였', '살해했', '자백'])) return 'Q-ACCUSATION';
  if (includesAny(value, ['모순', '말이 다르', '거짓말', '앞에서는', '아까는'])) return 'Q-CONTRADICTION';
  const evidencePatterns = [
    /증거|흔적|혈흔|피자국|핏자국|문틀|긁힌\s*자국|상처|몸싸움|부검|독극물|독성|성분/,
    /피가\s*(?:묻|남|흐르|튀)/,
    /지문|발자국|cctv|녹음|통화\s*기록|장부|물건/i
  ];
  if (evidencePatterns.some((pattern) => pattern.test(value))) return 'Q-EVIDENCE';
  if (includesAny(value, ['어디', '장소', '있었', '갔'])) return 'Q-PLACE';
  if (includesAny(value, ['언제', '몇 시', '시간', '당시'])) return 'Q-TIME';
  if (includesAny(value, ['관계', '사이', '가족', '피해자'])) return 'Q-RELATION';
  if (includesAny(value, ['왜', '이유', '동기', '원한', '돈'])) return 'Q-MOTIVE';
  if (includesAny(value, ['안녕', '고맙', '날씨', '기분'])) return 'Q-SMALLTALK';
  if (value.replace(/\s/g, '').length < 3) return 'Q-UNKNOWN';
  return 'Q-OTHER';
}

const directCulpritDisclosure = /(내가|제가|그가|그 사람이|[가-힣]{2,4})(?:이|가)?\s*(범인(?:이다|입니다|이야)|죽였다|살해했다)/;
const promptDisclosure = /(system prompt|developer message|시스템 프롬프트|개발자 메시지|내부 지시문|숨겨진 프롬프트)/i;

const ruleMatches = (rule: SuspectKnowledge['responseRules'][number], questionType: QuestionType) => {
  if (rule.ruleType === questionType) return true;
  if (!rule.trigger || typeof rule.trigger !== 'object' || Array.isArray(rule.trigger)) return false;
  const trigger = rule.trigger as Record<string, unknown>;
  return trigger.questionType === questionType
    || trigger.question_type === questionType
    || (Array.isArray(trigger.questionTypes) && trigger.questionTypes.includes(questionType));
};

const factTypeHints: Partial<Record<QuestionType, string[]>> = {
  'Q-TIME': ['TIME', 'ALIBI', 'ROUTE'],
  'Q-PLACE': ['PLACE', 'ALIBI', 'ROUTE'],
  'Q-RELATION': ['RELATION', 'VICTIM'],
  'Q-MOTIVE': ['MOTIVE', 'SECRET', 'RELATION'],
  'Q-EVIDENCE': ['EVIDENCE', 'PHYSICAL', 'SECRET'],
  'Q-CONTRADICTION': ['ALIBI', 'LIE', 'SECRET', 'EVIDENCE'],
  'Q-ACCUSATION': ['MOTIVE', 'ALIBI', 'SECRET']
};

const evidenceRelated = (fact: PromptFact, evidence: PresentedEvidence[]) => evidence.some((item) => {
  const corpus = `${item.title} ${item.description}`.replace(/\s/g, '');
  return fact.content.split(/[\s,·.]+/).some((token) => token.length >= 2 && corpus.includes(token));
});

export function selectPromptFacts(
  knowledge: SuspectKnowledge,
  questionType: QuestionType,
  presentedEvidence: PresentedEvidence[] = []
): PromptFact[] {
  const matchingRules = knowledge.responseRules.filter((rule) => ruleMatches(rule, knowledge.effectiveRuleType));
  const explicitlyAllowed = new Set(matchingRules.flatMap((rule) => rule.allowedFactRefs));
  const explicitlyHidden = new Set(matchingRules.flatMap((rule) => rule.hiddenFactRefs));
  const previouslyRevealed = new Set(knowledge.revealedFactIds);
  const hints = factTypeHints[questionType] ?? [];
  const limit = questionType === 'Q-EVIDENCE' || presentedEvidence.length ? 7 : 5;

  return knowledge.facts.filter((fact) => {
    if (fact.disclosureLevel === 'SERVER_ONLY') return false;
    if (explicitlyHidden.has(fact.id) || explicitlyHidden.has(fact.code)) return false;
    if (explicitlyAllowed.has(fact.id) || explicitlyAllowed.has(fact.code)) return true;
    if (previouslyRevealed.has(fact.id)) return true;
    if (fact.disclosureLevel === 'LLM_HIDDEN') return false;
    if (evidenceRelated(fact, presentedEvidence)) return true;
    return fact.disclosureLevel === 'LLM_ALLOWED' && hints.some((hint) => fact.factType.toUpperCase().includes(hint));
  }).sort((a, b) => {
    const score = (fact: PromptFact) => {
      if (explicitlyAllowed.has(fact.id) || explicitlyAllowed.has(fact.code)) return 100;
      if (evidenceRelated(fact, presentedEvidence)) return 80;
      if (previouslyRevealed.has(fact.id)) return 60;
      if (hints.some((hint) => fact.factType.toUpperCase().includes(hint))) return 40;
      return 10;
    };
    return score(b) - score(a) || a.code.localeCompare(b.code);
  }).slice(0, limit);
}

export function normalizeGuardedResponse(response: StructuredInterrogationResponse): StructuredInterrogationResponse {
  return {
    ...response,
    usedFactIds: [...new Set(response.usedFactIds)],
    revealedFactIds: [...new Set(response.revealedFactIds)],
    claimedFactIds: [...new Set(response.claimedFactIds)],
    characterConsistencyStatus: 'valid',
    validationNotes: []
  };
}

export function validateGuardedResponse(
  response: StructuredInterrogationResponse,
  knowledge: SuspectKnowledge
): string[] {
  const errors: string[] = [];
  const allowedFacts = new Set(knowledge.facts.filter((fact) => fact.disclosureLevel !== 'SERVER_ONLY').map((fact) => fact.id));
  const referenceLists = [response.usedFactIds, response.revealedFactIds, response.claimedFactIds];
  if (response.dialectResponse.length < 2 || response.dialectResponse.length > 500) errors.push('RESPONSE_LENGTH_INVALID');
  if (referenceLists.some((ids) => ids.some((id) => !allowedFacts.has(id)))) errors.push('FACT_NOT_ALLOWED');
  if (response.characterConsistencyStatus !== 'valid') errors.push('CONSISTENCY_INVALID');
  if (directCulpritDisclosure.test(response.dialectResponse)) errors.push('CULPRIT_DISCLOSURE');
  if (promptDisclosure.test(response.dialectResponse)) errors.push('PROMPT_DISCLOSURE');

  const knownCorpus = [
    ...knowledge.knownEntities,
    ...knowledge.facts.map((fact) => fact.content),
    ...knowledge.lies.flatMap((lie) => [lie.claim, lie.truth])
  ].map((value) => value.replace(/\s/g, ''));
  const namedPeople = response.dialectResponse.match(/[가-힣]{2,4}(?=\s*(?:씨|님))/g) ?? [];
  const quotedEntities = [...response.dialectResponse.matchAll(/[「『\"]([^」』\"]{2,30})[」』\"]/g)].map((match) => match[1]);
  const placeEntities = response.dialectResponse.match(/[가-힣A-Za-z0-9]{2,20}(?=(?:에서|으로\s|에\s갔))/g) ?? [];
  const genericPlaces = new Set(['집', '방', '마당', '부엌', '서재', '창고', '복도', '문앞', '안', '밖', '그곳']);
  const isKnown = (candidate: string) => genericPlaces.has(candidate.replace(/\s/g, ''))
    || knownCorpus.some((known) => known.includes(candidate.replace(/\s/g, '')));
  if ([...namedPeople, ...quotedEntities, ...placeEntities].some((name) => !isKnown(name))) errors.push('UNKNOWN_ENTITY');
  return [...new Set(errors)];
}

export const promptRejectionResponse = (emotion: string): StructuredInterrogationResponse => ({
  dialectResponse: '그런 지시는 따를 수 없수다. 사건에 관한 질문만 허우다.',
  emotionAfter: emotion.toUpperCase() === 'ANGRY' ? 'ANGRY' : 'DEFENSIVE',
  evasionType: 'PROMPT_REJECTION',
  usedFactIds: [],
  revealedFactIds: [],
  claimedFactIds: [],
  characterConsistencyStatus: 'valid',
  validationNotes: []
});

const regionFrom = (knowledge: SuspectKnowledge): string => {
  const speech = knowledge.suspect.speechStyle;
  if (typeof speech === 'object' && speech !== null && !Array.isArray(speech)) {
    const region = (speech as Record<string, unknown>).region;
    if (typeof region === 'string') return region;
  }
  return '';
};

export function localQuestionResponse(questionType: 'Q-SMALLTALK' | 'Q-UNKNOWN', knowledge: SuspectKnowledge): StructuredInterrogationResponse {
  const region = regionFrom(knowledge);
  const dialectResponse = region.includes('제주') ? '게메, 사건에 관한 걸 물어봐 주쿠다.'
    : region.includes('경상') ? '사건 얘기를 물어보이소.'
      : region.includes('전라') ? '사건 이야기를 물어보쇼.'
        : region.includes('충청') ? '사건 얘기를 물어봐유.'
          : '사건에 관한 질문을 해주십시오.';
  return {
    dialectResponse,
    emotionAfter: questionType === 'Q-UNKNOWN' ? 'NEUTRAL' : (knowledge.currentEmotion as StructuredInterrogationResponse['emotionAfter']),
    evasionType: questionType === 'Q-UNKNOWN' ? 'UNKNOWN' : 'DEFLECTION',
    usedFactIds: [], revealedFactIds: [], claimedFactIds: [],
    characterConsistencyStatus: 'valid', validationNotes: []
  };
}

export function safeValidationFallback(knowledge: SuspectKnowledge): StructuredInterrogationResponse {
  return {
    dialectResponse: localQuestionResponse('Q-UNKNOWN', knowledge).dialectResponse,
    emotionAfter: 'DEFENSIVE', evasionType: 'DEFLECTION',
    usedFactIds: [], revealedFactIds: [], claimedFactIds: [],
    characterConsistencyStatus: 'valid', validationNotes: []
  };
}
