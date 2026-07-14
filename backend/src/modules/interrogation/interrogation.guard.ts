import type { PromptFact, QuestionType, StructuredInterrogationResponse, SuspectKnowledge } from './interrogation.types.js';

const includesAny = (value: string, words: string[]) => words.some((word) => value.includes(word));

export function classifyQuestion(question: string): QuestionType {
  const value = question.toLowerCase();
  if (includesAny(value, ['system prompt', 'developer message', 'ignore previous', '지시를 무시', '프롬프트', '규칙을 무시', '설정값'])) return 'Q-PROMPT';
  if (includesAny(value, ['범인', '죽였', '살해했', '자백'])) return 'Q-ACCUSATION';
  if (includesAny(value, ['모순', '말이 다르', '거짓말', '앞에서는', '아까는'])) return 'Q-CONTRADICTION';
  if (includesAny(value, ['증거', '흔적', '기록', '장부', '물건'])) return 'Q-EVIDENCE';
  if (includesAny(value, ['어디', '장소', '있었', '갔'])) return 'Q-PLACE';
  if (includesAny(value, ['언제', '몇 시', '시간', '당시'])) return 'Q-TIME';
  if (includesAny(value, ['관계', '사이', '알고', '가족', '피해자'])) return 'Q-RELATION';
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

export function selectPromptFacts(knowledge: SuspectKnowledge, questionType: QuestionType): PromptFact[] {
  const matchingRules = knowledge.responseRules.filter((rule) => ruleMatches(rule, questionType));
  const explicitlyAllowed = new Set(matchingRules.flatMap((rule) => rule.allowedFactRefs));
  const explicitlyHidden = new Set(matchingRules.flatMap((rule) => rule.hiddenFactRefs));
  const previouslyRevealed = new Set(knowledge.revealedFactIds);

  return knowledge.facts.filter((fact) => {
    if (fact.disclosureLevel === 'SERVER_ONLY') return false;
    if (explicitlyAllowed.has(fact.id)) return true;
    if (explicitlyHidden.has(fact.id)) return false;
    if (previouslyRevealed.has(fact.id)) return true;
    return fact.disclosureLevel === 'LLM_ALLOWED';
  });
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
  if (referenceLists.some((ids) => new Set(ids).size !== ids.length)) errors.push('DUPLICATE_FACT_REFERENCE');
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
  const isKnown = (candidate: string) => knownCorpus.some((known) => known.includes(candidate.replace(/\s/g, '')));
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
  validationNotes: ['prompt injection rejected']
});
