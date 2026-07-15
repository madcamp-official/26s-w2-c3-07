import type { CaseCharacter, QuestionAnalysis, QuestionType, StructuredInterrogationResponse, SuspectKnowledge } from './interrogation.types.js';

const compact = (value: string) => value.toLowerCase().replace(/\s+/g, '');

export function characterAliases(character: CaseCharacter): string[] {
  const roleAliases = (character.victimRelation ?? character.occupation ?? '')
    .split(/[·,/()]/)
    .map((value) => value.trim())
    .filter((value) => value.length >= 2 && !/^(용의자|직원|무직)$/.test(value));
  const givenName = character.name.length >= 3 ? character.name.slice(1) : character.name;
  return [...new Set([character.name, givenName, ...roleAliases])].sort((a, b) => b.length - a.length);
}

function mentionedIn(question: string, characters: CaseCharacter[]): CaseCharacter[] {
  const normalized = compact(question);
  return characters.map((character) => ({
    character,
    position: Math.min(...characterAliases(character)
      .map((alias) => normalized.indexOf(compact(alias)))
      .filter((position) => position >= 0))
  })).filter((match) => Number.isFinite(match.position))
    .sort((a, b) => a.position - b.position)
    .map((match) => match.character);
}

function lastMentioned(knowledge: SuspectKnowledge): CaseCharacter | null {
  for (const message of [...knowledge.previousMessages].reverse()) {
    const characters = mentionedIn(message.question, knowledge.characters);
    if (characters.length === 1) return characters[0];
  }
  return null;
}

const intentFor = (type: QuestionType, hasOtherSubject: boolean, asksVictim: boolean): QuestionAnalysis['intent'] => {
  if (type === 'Q-SMALLTALK' || type === 'Q-UNKNOWN') return 'OFF_TOPIC';
  if (type === 'Q-RELATION') return 'ASK_RELATIONSHIP';
  if (type === 'Q-TIME' || type === 'Q-PLACE') return 'ASK_ALIBI';
  if (type === 'Q-MOTIVE') return 'ASK_MOTIVE';
  if (type === 'Q-EVIDENCE' || type === 'Q-CONTRADICTION' || type === 'Q-ACCUSATION') return 'ASK_EVIDENCE';
  if (hasOtherSubject) return 'ASK_OTHER_SUSPECT';
  if (asksVictim) return 'ASK_VICTIM';
  return 'ASK_ACTION';
};

export function analyzeQuestion(question: string, type: QuestionType, knowledge: SuspectKnowledge): QuestionAnalysis {
  const explicit = mentionedIn(question, knowledge.characters);
  const asksVictim = /피해자/.test(question) || Boolean(knowledge.victim && question.includes(knowledge.victim.name));
  const selfReference = /(당신|본인|너는|자네는|아주머니는|아저씨는)/.test(question);
  const pronounReference = /(그 사람|그 여자|그 남자|그 용의자)/.test(question);
  const recent = pronounReference && explicit.length === 0 ? lastMentioned(knowledge) : null;
  const mentioned = recent ? [recent] : explicit;
  let subject: CaseCharacter | null = mentioned.length ? mentioned[0] : null;
  if (!subject && (selfReference || (type === 'Q-RELATION' && asksVictim && !pronounReference))) {
    subject = knowledge.characters.find((character) => character.id === knowledge.suspect.id) ?? null;
  }
  const objectCharacter = mentioned.length > 1 ? mentioned[1] : null;
  const needsClarification = (pronounReference && !subject)
    || (type === 'Q-RELATION' && !subject && !asksVictim);
  const hasOtherSubject = Boolean(subject && subject.id !== knowledge.suspect.id);
  return {
    intent: needsClarification ? 'AMBIGUOUS' : intentFor(type, hasOtherSubject, asksVictim),
    speakerId: knowledge.suspect.id,
    subjectId: subject?.id ?? null,
    objectType: asksVictim ? 'VICTIM' : objectCharacter ? 'SUSPECT' : null,
    objectId: objectCharacter?.id ?? null,
    mentionedCharacterIds: mentioned.map((character) => character.id),
    isCaseRelated: !['Q-SMALLTALK', 'Q-UNKNOWN'].includes(type),
    needsClarification
  };
}

export function clarificationResponse(knowledge: SuspectKnowledge): StructuredInterrogationResponse {
  return {
    dialectResponse: '누구를 말씀하시는 건지 다시 말해 주시겠습니까?',
    emotionAfter: knowledge.currentEmotion as StructuredInterrogationResponse['emotionAfter'],
    evasionType: 'UNKNOWN', usedFactIds: [], revealedFactIds: [], claimedFactIds: [],
    characterConsistencyStatus: 'valid', validationNotes: []
  };
}

export function unknownKnowledgeResponse(knowledge: SuspectKnowledge): StructuredInterrogationResponse {
  return {
    dialectResponse: '그 부분은 저도 잘 모릅니다.',
    emotionAfter: knowledge.currentEmotion as StructuredInterrogationResponse['emotionAfter'],
    evasionType: 'UNKNOWN', usedFactIds: [], revealedFactIds: [], claimedFactIds: [],
    characterConsistencyStatus: 'valid', validationNotes: []
  };
}

export function validateQuestionTarget(response: StructuredInterrogationResponse, analysis: QuestionAnalysis, knowledge: SuspectKnowledge): string[] {
  if (analysis.intent !== 'ASK_RELATIONSHIP' || !analysis.subjectId || analysis.subjectId === analysis.speakerId) return [];
  const subject = knowledge.characters.find((character) => character.id === analysis.subjectId);
  if (!subject) return ['QUESTION_SUBJECT_UNKNOWN'];
  const answer = compact(response.dialectResponse);
  const subjectTerms = characterAliases(subject).filter((term) => term.length >= 2).map(compact);
  const addressesSubject = subjectTerms.some((term) => answer.includes(term));
  const substitutesSpeaker = /^(저는|제가|나는|내가)/.test(response.dialectResponse.trim());
  return !addressesSubject || substitutesSpeaker ? ['QUESTION_TARGET_MISMATCH'] : [];
}
