'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { api } from '@/lib/api-client';
import { ErrorState, LoadingState } from '@/components/ui/ApiState';
import { SuspectImage } from '@/features/suspect/components/SuspectImage';
import { AppHeader } from '@/components/layout/AppHeader';
import type { PublicSuspect } from '@/types/content';
import type { SessionView } from '@/types/session';
import type { DeductionResult } from '@/types/deduction';
import { ApiError } from '@/types/api';
import { playSfx } from '@/features/settings/audio';
import { useSfxEnabled } from '@/features/settings/useBgm';

export default function DeductionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sfxEnabled = useSfxEnabled();
  const session = useApiResource<SessionView>(`/sessions/${sessionId}`);
  const suspects = useApiResource<PublicSuspect[]>(session.data ? `/episodes/${session.data.episodeId}/suspects` : null);
  const [selected, setSelected] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  async function submit() {
    if (!selected || busy) return;
    setConfirm(true);
  }

  async function confirmSubmit() {
    if (!selected || busy) return;
    setBusy(true);
    setError(null);
    playSfx('submit', sfxEnabled);
    try {
      await api.post<DeductionResult>(`/sessions/${sessionId}/deduction`, { suspectId: selected });
      router.replace(`/game/${sessionId}/result`);
    } catch (cause) {
      console.error('최종 추리 제출 실패', cause);
      setError(cause as ApiError);
      setBusy(false);
    }
  }

  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100"><div className="mx-auto max-w-3xl space-y-7">
    <AppHeader /><Link href={`/game/${sessionId}`}>← 사건으로</Link>
    <header className="text-center"><p className="text-xs text-evidence-red">최종 추리</p><h1 className="font-display text-4xl">범인을 지목하세요</h1><p className="mt-2 opacity-60">정답 판정은 서버에서 한 번만 수행됩니다.</p></header>
    {session.loading || suspects.loading ? <LoadingState /> : error ? <ErrorState error={error} message="최종 추리를 진행하지 못했습니다. 다시 시도해 주세요." /> : <div className="grid gap-4 md:grid-cols-2">
      {suspects.data?.map((suspect) => <button key={suspect.id} onClick={() => { setSelected(suspect.id); setConfirm(false); }} className={`overflow-hidden border text-left ${selected === suspect.id ? 'border-evidence-red bg-evidence-red/20' : 'border-brass-600/30'}`}>
        <SuspectImage imageUrl={suspect.imageUrl} name={suspect.name} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[16/10] w-full" />
        <div className="p-5"><h2 className="font-display text-2xl">{suspect.name}</h2><p className="text-sm opacity-60">{suspect.occupation}</p></div>
      </button>)}
    </div>}
    <button onClick={submit} disabled={!selected || busy} className="w-full bg-evidence-red py-4 font-bold disabled:opacity-40">{busy ? '판정 중...' : '이 용의자 지목'}</button>
    {confirm && <div role="dialog" aria-modal="true" aria-label="최종 범인 제출 확인" className="fixed inset-0 z-50 grid place-items-center bg-noir-950/90 p-6"><div className="w-full max-w-md border border-brass-600/40 bg-noir-900 p-6"><h2 className="font-display text-2xl">최종 선택 확인</h2><p className="mt-4 whitespace-pre-line">이 용의자를 최종 범인으로 지목하시겠습니까?{`\n`}제출 후에는 심문으로 돌아갈 수 없습니다.</p><div className="mt-6 grid grid-cols-2 gap-3"><button type="button" disabled={busy} onClick={() => setConfirm(false)} className="border border-brass-600/40 py-3">취소</button><button type="button" disabled={busy} onClick={() => void confirmSubmit()} className="bg-evidence-red py-3 font-bold">{busy ? '제출 중...' : '최종 제출'}</button></div></div></div>}
  </div></main></AuthGuard>;
}
