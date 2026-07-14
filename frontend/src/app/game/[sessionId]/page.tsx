'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { api } from '@/lib/api-client';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/ApiState';
import Image from 'next/image';
import { SuspectImage } from '@/features/suspect/components/SuspectImage';
import { AppHeader } from '@/components/layout/AppHeader';
import { EvidenceModal } from '@/components/ui/EvidenceModal';
import { resolveEvidenceImage } from '@/features/episode/utils/evidenceImage';
import type { EpisodeDetail, PublicSuspect } from '@/types/content';
import type { Clue, Evidence, EvidenceViewResult } from '@/types/clue';
import type { SessionView } from '@/types/session';
import { ApiError } from '@/types/api';

const terminalMessage: Partial<Record<SessionView['status'], string>> = { EXPIRED: '세션 시간이 만료되었습니다.', ABANDONED: '포기한 세션입니다.', COMPLETED: '이미 완료된 세션입니다.' };
export default function GamePage() {
  const { sessionId } = useParams<{ sessionId: string }>(); const router = useRouter();
  const session = useApiResource<SessionView>(`/sessions/${sessionId}`);
  const episode = useApiResource<EpisodeDetail>(session.data ? `/episodes/${session.data.episodeId}` : null);
  const suspects = useApiResource<PublicSuspect[]>(session.data ? `/episodes/${session.data.episodeId}/suspects` : null);
  const evidence = useApiResource<Evidence[]>(`/sessions/${sessionId}/evidence`); const clues = useApiResource<Clue[]>(`/sessions/${sessionId}/clues`);
  const [actionError, setActionError] = useState<ApiError | null>(null); const [busy, setBusy] = useState(''); const [notice, setNotice] = useState('');
  const [previewEvidence, setPreviewEvidence] = useState<Evidence | null>(null);
  const [presentedEvidenceId, setPresentedEvidenceId] = useState<string | null>(null);
  async function choose(suspectId: string) { if (busy) return; setBusy(suspectId); setActionError(null); try { await api.patch(`/sessions/${sessionId}/current-suspect`, { suspectId }); const query = presentedEvidenceId ? `?evidenceId=${encodeURIComponent(presentedEvidenceId)}` : ''; router.push(`/game/${sessionId}/interrogation/${suspectId}${query}`); } catch (e) { setActionError(e as ApiError); setBusy(''); } }
  async function view(item: Evidence) { if (busy) return; setBusy(item.id); try { const result = await api.post<EvidenceViewResult>(`/sessions/${sessionId}/evidence/${item.id}/view`); setPresentedEvidenceId(item.id); const notices = [result.newClueIds.length ? `새 단서 ${result.newClueIds.length}개` : '', result.newlyUnlockedEvidence.length ? `새 증거 ${result.newlyUnlockedEvidence.length}개` : ''].filter(Boolean); setNotice(notices.length ? `${notices.join(', ')}를 획득했습니다.` : '증거를 확인했습니다.'); await Promise.all([evidence.reload(), clues.reload(), session.reload()]); } catch (e) { setActionError(e as ApiError); } finally { setBusy(''); } }
  async function deduction() { setBusy('deduction'); try { await api.post(`/sessions/${sessionId}/enter-deduction`); router.push(`/game/${sessionId}/deduction`); } catch (e) { setActionError(e as ApiError); setBusy(''); } }
  if (session.loading) return <LoadingState label="게임 세션을 복구하는 중..." />;
  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100"><div className="mx-auto max-w-5xl space-y-7">
    <AppHeader />
    {session.error ? <ErrorState error={session.error} retry={session.reload} /> : session.data && <>
      <header className="flex flex-wrap justify-between gap-3"><div><p className="text-xs text-evidence-red">{session.data.status} · {session.data.difficulty}</p><h1 className="font-display text-4xl">{episode.data?.title ?? '사건 수사'}</h1></div><Link href={`/game/${sessionId}/records`} className="border border-brass-600/40 px-4 py-2">사건 기록</Link></header>
      {terminalMessage[session.data.status] && <div className="border border-evidence-red/50 bg-evidence-red/10 p-4">{terminalMessage[session.data.status]} {session.data.status === 'COMPLETED' && <Link className="ml-2 underline" href={`/game/${sessionId}/result`}>결과 보기</Link>}</div>}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4"><div className="border p-3">남은 질문 <b>{session.data.remainingQuestions}</b></div><div className="border p-3">남은 시간 <b>{session.data.remainingSeconds}초</b></div><div className="border p-3">단서 <b>{session.data.acquiredClueCount}</b></div><div className="border p-3">상태 <b>{session.data.status}</b></div></section>
      {notice && <p role="status" className="border border-brass-400 bg-brass-600/10 p-3">{notice}</p>}{actionError && <ErrorState error={actionError} />}
      <section><h2 className="mb-3 font-display text-2xl">열람 가능한 증거</h2>{!evidence.data?.length ? <EmptyState label="현재 열람 가능한 증거가 없습니다." /> : <div className="grid gap-3 md:grid-cols-2">{evidence.data.map((item) => { const image = resolveEvidenceImage(item.code); return <div key={item.id} className="flex gap-3 border border-brass-600/30 p-4">{image && <button onClick={() => setPreviewEvidence(item)} className="relative h-20 w-20 shrink-0 overflow-hidden border border-brass-600/30"><Image src={image} alt={item.title} fill sizes="80px" className="object-cover" /></button>}<button onClick={() => view(item)} disabled={Boolean(busy) || Boolean(terminalMessage[session.data!.status])} className="flex-1 text-left disabled:opacity-50"><b>{item.title}</b><span className="float-right text-xs">{item.viewedAt ? '열람 완료' : '열람 가능'}</span><p className="mt-2 text-sm opacity-60">{item.description}</p></button></div>; })}</div>}</section>
      {previewEvidence && <EvidenceModal title={previewEvidence.title} description={previewEvidence.description} image={resolveEvidenceImage(previewEvidence.code)} onClose={() => setPreviewEvidence(null)} />}
      <section><h2 className="mb-3 font-display text-2xl">심문할 용의자</h2>{suspects.loading ? <LoadingState /> : !suspects.data?.length ? <EmptyState label="용의자 정보가 없습니다." /> : <div className="grid gap-4 md:grid-cols-2">{suspects.data.map((suspect) => { const state = session.data!.suspectStates.find((item) => item.suspectId === suspect.id); return <button key={suspect.id} onClick={() => choose(suspect.id)} disabled={Boolean(busy) || Boolean(terminalMessage[session.data!.status]) || session.data!.remainingQuestions === 0} className="overflow-hidden border border-brass-600/30 bg-noir-900/70 text-left disabled:opacity-40"><SuspectImage imageUrl={suspect.imageUrl} name={suspect.name} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[16/10] w-full" /><div className="p-5"><h3 className="font-display text-xl">{suspect.name}</h3><p className="text-sm opacity-60">{suspect.occupation}</p><p className="mt-2 text-xs">감정 {state?.emotion ?? suspect.initialEmotion} · 질문 {state?.questionsAsked ?? 0}회</p></div></button>; })}</div>}</section>
      <button onClick={deduction} disabled={Boolean(busy) || Boolean(terminalMessage[session.data.status])} className="w-full bg-evidence-red py-4 font-display text-lg font-bold disabled:opacity-40">최종 추리로 이동</button>
    </>}
  </div></main></AuthGuard>;
}
