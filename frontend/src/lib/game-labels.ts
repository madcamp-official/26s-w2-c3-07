const STATUS_LABELS: Record<string, string> = {
  READY: '준비', INVESTIGATING: '수사 중', INTERROGATING: '심문 중', DEDUCTION: '최종 추리',
  COMPLETED: '완료', ABANDONED: '포기', EXPIRED: '시간 만료', SUBMITTED: '제출 완료'
};

const EMOTION_LABELS: Record<string, string> = {
  CALM: '침착', NEUTRAL: '중립', NERVOUS: '긴장', DEFENSIVE: '방어적', ANGRY: '분노',
  FEARFUL: '두려움', GUILTY: '죄책감', SAD: '슬픔', ANXIOUS: '불안', BREAKDOWN: '감정 붕괴',
  MOCKING: '조롱', AGGRESSIVE: '공격적', AGGRESSIVE_DEFENSIVE: '공격적 방어'
};

const QUESTION_TYPE_LABELS: Record<string, string> = {
  'Q-TIME': '시간 질문', 'Q-PLACE': '장소 질문', 'Q-RELATION': '관계 질문', 'Q-MOTIVE': '동기 질문',
  'Q-EVIDENCE': '증거 질문', 'Q-CONTRADICTION': '모순 추궁', 'Q-ACCUSATION': '혐의 추궁',
  'Q-OTHER': '일반 질문', 'Q-UNKNOWN': '기타 질문'
};

const DIFFICULTY_LABELS: Record<string, string> = { EASY: '쉬움', NORMAL: '보통', HARD: '어려움' };
const RESOLUTION_LABELS: Record<string, string> = { FULL_RESOLUTION: '완전 해결', CULPRIT_CORRECT: '범인 지목 성공', WRONG_SUSPECT: '잘못된 용의자 지목' };
const NOTE_TYPE_LABELS: Record<string, string> = { FREE: '자유 메모', CONTRADICTION: '모순', DIALECT: '사투리' };

const label = (labels: Record<string, string>, value: string | null | undefined, fallback: string) =>
  value ? labels[value.toUpperCase()] ?? fallback : fallback;

export const sessionStatusLabel = (value: string | null | undefined) => label(STATUS_LABELS, value, '상태 확인 중');
export const emotionLabel = (value: string | null | undefined) => label(EMOTION_LABELS, value, '확인되지 않음');
export const questionTypeLabel = (value: string | null | undefined) => label(QUESTION_TYPE_LABELS, value, '기타 질문');
export const difficultyLabel = (value: string | null | undefined) => label(DIFFICULTY_LABELS, value, '보통');
export const resolutionLabel = (value: string | null | undefined) => label(RESOLUTION_LABELS, value, '추리 결과');
export const noteTypeLabel = (value: string | null | undefined) => label(NOTE_TYPE_LABELS, value, '메모');
