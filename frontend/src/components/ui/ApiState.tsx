import { ApiError } from '@/types/api';

export function LoadingState({ label = '불러오는 중...' }: { label?: string }) {
  return <div className="border border-brass-600/30 bg-noir-900/60 p-8 text-center text-parchment-300">{label}</div>;
}
export function EmptyState({ label }: { label: string }) {
  return <div className="border border-brass-600/30 bg-noir-900/60 p-8 text-center text-parchment-300/70">{label}</div>;
}
const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: '서버에 연결하지 못했습니다. 네트워크 연결을 확인해 주세요.',
  SESSION_NOT_FOUND: '게임 정보를 찾지 못했습니다.',
  SESSION_EXPIRED: '심문 시간이 종료되었습니다.',
  INTERROGATION_SUSPECT_LIMIT_REACHED: '이 용의자에게 가능한 질문을 모두 사용했습니다.',
  INTERROGATION_QUESTIONS_EXHAUSTED: '사용 가능한 질문을 모두 사용했습니다.',
  EVIDENCE_NOT_AVAILABLE: '증거 정보를 불러오지 못했습니다.',
  NOTE_NOT_FOUND: '메모를 찾지 못했습니다.',
  DEDUCTION_ALREADY_SUBMITTED: '최종 추리가 이미 제출되었습니다.'
};
export function userErrorMessage(error: ApiError | Error, fallback = '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.') {
  return error instanceof ApiError ? ERROR_MESSAGES[error.code] ?? fallback : fallback;
}
export function ErrorState({ error, retry, message }: { error: ApiError | Error; retry?: () => void; message?: string }) {
  return <div role="alert" className="border border-evidence-red/50 bg-evidence-red/10 p-5 text-parchment-100">
    <p className="font-bold">{message ?? userErrorMessage(error)}</p>
    {retry && <button type="button" onClick={retry} className="mt-3 border border-brass-400 px-3 py-1 text-sm">다시 시도</button>}
  </div>;
}
