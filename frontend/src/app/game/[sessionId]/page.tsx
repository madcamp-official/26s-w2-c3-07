'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { api } from '@/lib/api-client';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/ApiState';
import { SuspectImage } from '@/features/suspect/components/SuspectImage';
import { AppHeader } from '@/components/layout/AppHeader';
import { EvidenceModal } from '@/components/ui/EvidenceModal';
import { resolveEvidenceImage } from '@/features/episode/utils/evidenceImage';
import { difficultyLabel, emotionLabel, sessionStatusLabel } from '@/lib/game-labels';
import type { EpisodeDetail, PublicSuspect } from '@/types/content';
import type { Clue, Evidence, EvidenceViewResult } from '@/types/clue';
import type { SessionView } from '@/types/session';
import { ApiError } from '@/types/api';

const terminalMessage: Partial<Record<SessionView['status'], string>> = {
  EXPIRED: '세션 시간이 만료되었습니다.', ABANDONED: '포기한 세션입니다.', COMPLETED: '이미 완료된 세션입니다.'
};

export default function GamePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const session = useApiResource<SessionView>(`/sessions/${sessionId}`);
  const episode = useApiResource<EpisodeDetail>(session.data ? `/episodes/${session.data.episodeId}` : null);
  const suspects = useApiResource<PublicSuspect[]>(session.data ? `/episodes/${session.data.episodeId}/suspects` : null);
  const evidence = useApiResource<Evidence[]>(`/sessions/${sessionId}/evidence`);
  const clues = useApiResource<Clue[]>(`/sessions/${sessionId}/clues`);
  const [actionError, setActionError] = useState<ApiError | null>(null);
  const [evidenceError, setEvidenceError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [previewEvidence, setPreviewEvidence] = useState<Evidence | null>(null);
  const [viewingEvidenceId, setViewingEvidenceId] = useState<string | null>(null);
  const [presentedEvidenceId, setPresentedEvidenceId] = useState<string | null>(null);

  async function choose(suspectId: string) {
    if (busy) return;
    setBusy(suspectId); setActionError(null);
    try {
      await api.patch(`/sessions/${sessionId}/current-suspect`, { suspectId });
      const query = presentedEvidenceId ? `?evidenceId=${encodeURIComponent(presentedEvidenceId)}` : '';
      router.push(`/game/${sessionId}/interrogation/${suspectId}${query}`);
    } catch (cause) {
      console.error('용의자 선택 실패', cause);
      setActionError(cause as ApiError); setBusy('');
    }
  }

  async function view(item: Evidence) {
    if (viewingEvidenceId) return;
    setPreviewEvidence(item); setViewingEvidenceId(item.id); setEvidenceError(null);
    try {
      const result = await api.post<EvidenceViewResult>(`/sessions/${sessionId}/evidence/${item.id}/view`);
      const newClues = Array.isArray(result?.newClues) ? result.newClues : [];
      const newEvidence = Array.isArray(result?.newlyUnlockedEvidence) ? result.newlyUnlockedEvidence : [];
      setPreviewEvidence(result?.evidence ?? item);
      setPresentedEvidenceId(item.id);
      const notices = [newClues.length ? `새 단서 ${newClues.length}개` : '', newEvidence.length ? `새 증거 ${newEvidence.length}개` : ''].filter(Boolean);
      setNotice(notices.length ? `${notices.join(', ')}를 획득했습니다.` : '증거를 확인했습니다.');
      await Promise.all([evidence.reload(), clues.reload(), session.reload()]);
    } catch (cause) {
      console.error('증거 조회 실패', cause);
      setEvidenceError(cause as ApiError);
    } finally {
      setViewingEvidenceId(null);
    }
  }

  async function deduction() {
    setBusy('deduction'); setActionError(null);
    try { await api.post(`/sessions/${sessionId}/enter-deduction`); router.push(`/game/${sessionId}/deduction`); }
    catch (cause) { console.error('최종 추리 진입 실패', cause); setActionError(cause as ApiError); setBusy(''); }
  }

  if (session.loading) return <LoadingState label="게임 세션을 복구하는 중..." />;
  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100"><div className="mx-auto max-w-5xl space-y-7">
    <AppHeader />
    {session.error ? <ErrorState error={session.error} retry={session.reload} message="게임 정보를 불러오지 못했습니다." /> : session.data && <>
      <header className="flex flex-wrap justify-between gap-3"><div><p className="text-xs text-evidence-red">{sessionStatusLabel(session.data.status)} · {difficultyLabel(session.data.difficulty)}</p><h1 className="font-display text-4xl">{episode.data?.title ?? '사건 수사'}</h1></div><Link href={`/game/${sessionId}/records`} className="border border-brass-600/40 px-4 py-2">사건 기록</Link></header>
      {terminalMessage[session.data.status] && <div className="border border-evidence-red/50 bg-evidence-red/10 p-4">{terminalMessage[session.data.status]} {session.data.status === 'COMPLETED' && <Link className="ml-2 underline" href={`/game/${sessionId}/result`}>결과 보기</Link>}</div>}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4"><div className="border p-3">남은 질문 <b>{session.data.remainingQuestions}</b></div><div className="border p-3">남은 시간 <b>{session.data.remainingSeconds}초</b></div><div className="border p-3">단서 <b>{session.data.acquiredClueCount}</b></div><div className="border p-3">상태 <b>{sessionStatusLabel(session.data.status)}</b></div></section>
      {notice && <p role="status" className="border border-brass-400 bg-brass-600/10 p-3">{notice}</p>}
      {actionError && <ErrorState error={actionError} />}
      <section><h2 className="mb-3 font-display text-2xl">열람 가능한 증거</h2>
        {evidence.loading ? <LoadingState label="증거 정보를 불러오는 중..." /> : evidence.error ? <ErrorState error={evidence.error} retry={evidence.reload} message="증거 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." /> : !evidence.data?.length ? <EmptyState label="현재 열람 가능한 증거가 없습니다." /> : <div className="grid gap-3 md:grid-cols-2">
          {evidence.data.map((item) => { const image = resolveEvidenceImage(item.code); return <button key={item.id} onClick={() => void view(item)} disabled={Boolean(viewingEvidenceId)} className="flex gap-3 border border-brass-600/30 p-4 text-left disabled:opacity-50">
            <span className="relative h-20 w-20 shrink-0 overflow-hidden border border-brass-600/30 bg-noir-950">{image ? <Image src={image} alt="" fill sizes="80px" className="object-cover" /> : <span className="grid h-full place-items-center text-center text-xs opacity-50">이미지 없음</span>}</span>
            <span className="flex-1"><b>{item.title}</b><span className="float-right text-xs">{item.viewedAt ? '열람 완료' : '열람 가능'}</span><span className="mt-2 block text-sm opacity-60">{item.description || '상세 설명이 없습니다.'}</span></span>
          </button>; })}
        </div>}
      </section>
      {previewEvidence && <EvidenceModal title={previewEvidence.title} description={previewEvidence.description} image={resolveEvidenceImage(previewEvidence.code)} discoveredAt={previewEvidence.discoveredAt} viewedAt={previewEvidence.viewedAt} source={previewEvidence.source} loading={viewingEvidenceId === previewEvidence.id} onClose={() => { setPreviewEvidence(null); setEvidenceError(null); }} />}
      {evidenceError && <ErrorState error={evidenceError} retry={previewEvidence ? () => void view(previewEvidence) : undefined} message="증거 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." />}
      <section><h2 className="mb-3 font-display text-2xl">심문할 용의자</h2>
        {suspects.loading ? <LoadingState /> : !suspects.data?.length ? <EmptyState label="용의자 정보가 없습니다." /> : <div className="grid gap-4 md:grid-cols-2">{suspects.data.map((suspect) => { const state = session.data!.suspectStates.find((item) => item.suspectId === suspect.id); return <button key={suspect.id} onClick={() => void choose(suspect.id)} disabled={Boolean(busy) || Boolean(terminalMessage[session.data!.status]) || session.data!.remainingQuestions === 0} className="overflow-hidden border border-brass-600/30 bg-noir-900/70 text-left disabled:opacity-40"><SuspectImage imageUrl={suspect.imageUrl} name={suspect.name} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[16/10] w-full" /><div className="p-5"><h3 className="font-display text-xl">{suspect.name}</h3><p className="text-sm opacity-60">{suspect.occupation}</p><p className="mt-2 text-xs">감정 {emotionLabel(state?.emotion ?? suspect.initialEmotion)} · 질문 {state?.questionsAsked ?? 0}회</p></div></button>; })}</div>}
      </section>
      <button onClick={() => void deduction()} disabled={Boolean(busy) || Boolean(terminalMessage[session.data.status])} className="w-full bg-evidence-red py-4 font-display text-lg font-bold disabled:opacity-40">최종 추리로 이동</button>
    </>}
  </div></main></AuthGuard>;
}
