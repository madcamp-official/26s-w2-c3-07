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
import { ClueModal } from '@/components/ui/ClueModal';
import { resolveEvidenceImage } from '@/features/episode/utils/evidenceImage';
import { difficultyLabel, emotionLabel, sessionStatusLabel } from '@/lib/game-labels';
import type { EpisodeDetail, PublicSuspect } from '@/types/content';
import type { Clue, Evidence, EvidenceViewResult } from '@/types/clue';
import type { SessionView } from '@/types/session';
import { ApiError } from '@/types/api';
import { useSessionExpiry } from '@/features/session/useSessionExpiry';
import { ExpiryNotice } from '@/features/session/components/ExpiryNotice';
import { playSfx } from '@/features/settings/audio';
import { useSfxEnabled } from '@/features/settings/useBgm';
import { useResolvedSessionRoute } from '@/features/session/useResolvedSessionRoute';

const terminalMessage: Partial<Record<SessionView['status'], string>> = {
  EXPIRED: '세션 시간이 만료되었습니다.', ABANDONED: '포기한 세션입니다.', COMPLETED: '이미 완료된 세션입니다.'
};
const suspectQuestionLabel = (remaining: number) => remaining > 0 ? `질문 ${remaining}회 남음` : '질문 완료';

export default function GamePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sfxEnabled = useSfxEnabled();
  const route = useResolvedSessionRoute(sessionId);
  const actualSessionId = route.data?.sessionId;
  const gamePath = `/game/${route.data?.episodeCode ?? sessionId}`;
  const session = useApiResource<SessionView>(actualSessionId ? `/sessions/${actualSessionId}` : null);
  const episode = useApiResource<EpisodeDetail>(session.data ? `/episodes/${session.data.episodeId}` : null);
  const suspects = useApiResource<PublicSuspect[]>(session.data ? `/episodes/${session.data.episodeId}/suspects` : null);
  const evidence = useApiResource<Evidence[]>(session.data ? `/sessions/${session.data.sessionId}/evidence` : null);
  const clues = useApiResource<Clue[]>(session.data ? `/sessions/${session.data.sessionId}/clues` : null);
  const [actionError, setActionError] = useState<ApiError | null>(null);
  const [evidenceError, setEvidenceError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [previewEvidence, setPreviewEvidence] = useState<Evidence | null>(null);
  const [viewingEvidenceId, setViewingEvidenceId] = useState<string | null>(null);
  const [presentedEvidenceId, setPresentedEvidenceId] = useState<string | null>(null);
  const [clueModalOpen, setClueModalOpen] = useState(false);
  const [selectedClueId, setSelectedClueId] = useState<string | null>(null);
  const [newClueIds, setNewClueIds] = useState<string[]>([]);
  const expiry = useSessionExpiry(session.data, actualSessionId ?? sessionId, false);

  async function choose(suspect: PublicSuspect) {
    if (!actualSessionId) return;
    if (busy) return;
    setBusy(suspect.id); setActionError(null);
    try {
      playSfx('select', sfxEnabled);
      await api.patch(`/sessions/${actualSessionId}/current-suspect`, { suspectId: suspect.id });
      const query = presentedEvidenceId ? `?evidenceId=${encodeURIComponent(presentedEvidenceId)}` : '';
      router.push(`${gamePath}/interrogation/${suspect.code}${query}`);
    } catch (cause) {
      console.error('용의자 선택 실패', cause);
      setActionError(cause as ApiError); setBusy('');
    }
  }

  async function view(item: Evidence) {
    if (!actualSessionId) return;
    if (viewingEvidenceId) return;
    setPreviewEvidence(item); setViewingEvidenceId(item.id); setEvidenceError(null);
    try {
      playSfx('evidence', sfxEnabled);
      const result = await api.post<EvidenceViewResult>(`/sessions/${actualSessionId}/evidence/${item.id}/view`);
      const newClues = Array.isArray(result?.newClues) ? result.newClues : [];
      const newEvidence = Array.isArray(result?.newlyUnlockedEvidence) ? result.newlyUnlockedEvidence : [];
      setPreviewEvidence(result?.evidence ?? item);
      setPresentedEvidenceId(item.id);
      setNewClueIds(newClues.map((clue) => clue.id));
      setSelectedClueId(newClues[0]?.id ?? null);
      const notices = [newClues.length ? `새로운 단서를 획득했습니다. 단서: ${newClues.map((clue) => clue.title).join(', ')}` : '', newEvidence.length ? `새 증거 ${newEvidence.length}개` : ''].filter(Boolean);
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
    if (busy) return;
    playSfx('submit', sfxEnabled);
    router.push(`${gamePath}/deduction`);
  }

  if (route.loading) return <LoadingState label="게임 주소를 확인하는 중..." />;
  if (route.error) return <ErrorState error={route.error} retry={route.reload} message="게임 세션을 찾을 수 없습니다." />;
  if (session.loading) return <LoadingState label="게임 세션을 복구하는 중..." />;
  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100"><div className="mx-auto max-w-5xl space-y-7">
    <AppHeader />
    {session.error ? <ErrorState error={session.error} retry={session.reload} message="게임 정보를 불러오지 못했습니다." /> : session.data && <>
      <header className="flex flex-wrap justify-between gap-3"><div><p className="text-xs text-evidence-red">{sessionStatusLabel(session.data.status)} · {difficultyLabel(session.data.difficulty)}</p><h1 className="font-display text-4xl">{episode.data?.title ?? '사건 수사'}</h1></div><Link href={`${gamePath}/records`} className="border border-brass-600/40 px-4 py-2">사건 기록</Link></header>
      {terminalMessage[session.data.status] && <div className="border border-evidence-red/50 bg-evidence-red/10 p-4">{terminalMessage[session.data.status]} {session.data.status === 'COMPLETED' && <Link className="ml-2 underline" href={`${gamePath}/result`}>결과 보기</Link>}</div>}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4"><div className="border p-3">남은 질문 <b>{session.data.remainingQuestions}</b></div><div className="border p-3">남은 시간 <b>{expiry.remainingSeconds}초</b></div><button onClick={() => { setSelectedClueId(null); setClueModalOpen(true); }} className="border p-3 text-left">단서 <b>{session.data.acquiredClueCount}</b><span className="ml-2 text-xs opacity-60">목록 보기</span></button><div className="border p-3">상태 <b>{expiry.remainingSeconds === 0 ? '시간 만료' : sessionStatusLabel(session.data.status)}</b></div></section>
      {notice && <button type="button" role="status" onClick={() => { if (newClueIds.length) setClueModalOpen(true); }} className="w-full border border-brass-400 bg-brass-600/10 p-3 text-left">{notice}</button>}
      {actionError && <ErrorState error={actionError} />}
      <section><h2 className="mb-3 font-display text-2xl">열람 가능한 증거</h2>
        {evidence.loading ? <LoadingState label="증거 정보를 불러오는 중..." /> : evidence.error ? <ErrorState error={evidence.error} retry={evidence.reload} message={evidence.error.status === 401 ? '인증이 만료되어 증거를 불러올 수 없습니다.' : evidence.error.status === 404 ? '현재 사건 세션을 찾을 수 없습니다.' : '증거 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'} /> : !evidence.data?.length ? <EmptyState label="아직 열람 가능한 증거가 없습니다. 조사 조건을 충족하면 잠긴 증거가 공개됩니다." /> : <div className="grid gap-3 md:grid-cols-2">
          {evidence.data.map((item) => { const image = resolveEvidenceImage(item.code); return <button key={item.id} onClick={() => void view(item)} disabled={Boolean(viewingEvidenceId)} className="flex gap-3 border border-brass-600/30 p-4 text-left disabled:opacity-50">
            <span className="relative h-20 w-20 shrink-0 overflow-hidden border border-brass-600/30 bg-noir-950">{image ? <Image src={image} alt="" fill sizes="80px" className="object-cover" /> : <span className="grid h-full place-items-center text-center text-xs opacity-50">이미지 없음</span>}</span>
            <span className="flex-1"><b>{item.title}</b><span className="float-right text-xs">{item.viewedAt ? '열람 완료' : '열람 가능'}</span><span className="mt-2 block text-sm opacity-60">{item.description || '상세 설명이 없습니다.'}</span></span>
          </button>; })}
        </div>}
      </section>
      {previewEvidence && <EvidenceModal title={previewEvidence.title} description={previewEvidence.description} image={resolveEvidenceImage(previewEvidence.code)} discoveredAt={previewEvidence.discoveredAt} viewedAt={previewEvidence.viewedAt} source={previewEvidence.source} loading={viewingEvidenceId === previewEvidence.id} onClose={() => { setPreviewEvidence(null); setEvidenceError(null); }} />}
      {evidenceError && <ErrorState error={evidenceError} retry={previewEvidence ? () => void view(previewEvidence) : undefined} message="증거 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." />}
      {clueModalOpen && <ClueModal clues={Array.isArray(clues.data) ? clues.data : []} highlightedIds={newClueIds} initialSelectedId={selectedClueId} onClose={() => setClueModalOpen(false)} />}
      <section><h2 className="mb-3 font-display text-2xl">심문할 용의자</h2>
        {suspects.loading ? <LoadingState /> : !suspects.data?.length ? <EmptyState label="용의자 정보가 없습니다." /> : <div className="grid gap-4 md:grid-cols-2">{suspects.data.map((suspect) => { const state = session.data!.suspectStates.find((item) => item.suspectId === suspect.id); const remaining = state?.questionsRemaining ?? session.data!.questionsPerSuspect; return <button key={suspect.id} onClick={() => void choose(suspect)} disabled={Boolean(busy) || Boolean(terminalMessage[session.data!.status]) || session.data!.remainingQuestions === 0 || remaining === 0} className="overflow-hidden border border-brass-600/30 bg-noir-900/70 text-left disabled:opacity-40"><SuspectImage imageUrl={suspect.imageUrl} name={suspect.name} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[16/10] w-full" /><div className="p-5"><h3 className="font-display text-xl">{suspect.name}</h3><p className="text-sm opacity-60">{suspect.occupation}</p><p className="mt-2 text-xs">감정 {emotionLabel(state?.emotion)} · {suspectQuestionLabel(remaining)}</p>{remaining === 0 && <p className="mt-1 text-xs text-evidence-red">더 이상 질문할 수 없음</p>}</div></button>; })}</div>}
      </section>
      <button onClick={() => void deduction()} disabled={Boolean(busy) || ['COMPLETED', 'ABANDONED'].includes(session.data.status)} className="w-full bg-evidence-red py-4 font-display text-lg font-bold disabled:opacity-40">최종 추리로 이동</button>
      {expiry.showExpiryNotice && <ExpiryNotice />}
    </>}
  </div></main></AuthGuard>;
}
