import { ApiError } from '@/types/api';

export function LoadingState({ label = '불러오는 중...' }: { label?: string }) {
  return <div className="border border-brass-600/30 bg-noir-900/60 p-8 text-center text-parchment-300">{label}</div>;
}
export function EmptyState({ label }: { label: string }) {
  return <div className="border border-brass-600/30 bg-noir-900/60 p-8 text-center text-parchment-300/70">{label}</div>;
}
export function ErrorState({ error, retry }: { error: ApiError | Error; retry?: () => void }) {
  const code = error instanceof ApiError ? error.code : 'UNKNOWN_ERROR';
  return <div role="alert" className="border border-evidence-red/50 bg-evidence-red/10 p-5 text-parchment-100">
    <p className="font-bold">요청을 처리하지 못했습니다.</p><p className="mt-1 text-sm">{error.message}</p><p className="mt-1 text-xs opacity-60">{code}</p>
    {retry && <button type="button" onClick={retry} className="mt-3 border border-brass-400 px-3 py-1 text-sm">다시 시도</button>}
  </div>;
}
