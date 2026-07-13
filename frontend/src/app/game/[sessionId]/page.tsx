'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { api } from '@/lib/api-client';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/ApiState';
import { SessionProgressBar } from '@/features/session/components/SessionProgressBar';
import { SuspectStatusCard } from '@/features/session/components/SuspectStatusCard';
import type { EpisodeDetail, PublicSuspect } from '@/types/content';
import type { Clue, Evidence, EvidenceViewResult } from '@/types/clue';
import type { SessionView } from '@/types/session';
import { ApiError } from '@/types/api';

const terminalMessage: Partial<Record<SessionView['status'], string>> = { EXPIRED: '세션 시간이 만료되었습니다.', ABANDONED: '포기한 세션입니다.', COMPLETED: '이미 완료된 세션입니다.' };

export default function GamePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const session = useApiResource<SessionView>(`/sessions/${sessionId}`);
  const episode = useApiResource<EpisodeDetail>(session.data ? `/episodes/${session.data.episodeId}` : null);
  const suspects = useApiResource<PublicSuspect[]>(session.data ? `/episodes/${session.data.episodeId}/suspects` : null);
  const evidence = useApiResource<Evidence[]>(`/sessions/${sessionId}/evidence`);
  const clues = useApiResource<Clue[]>(`/sessions/${sessionId}/clues`);
  const [actionError, setActionError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  async function choose(suspectId: string) { if (busy) return; setBusy(suspectId); setActionError(null); try { await api.patch(`/sessions/${sessionId}/current-suspect`, { suspectId }); router.push(`/game/${sessionId}/interrogation/${suspectId}`); } catch (error) { setActionError(error as ApiError); setBusy(''); } }
  async function view(item: Evidence) { if (busy) return; setBusy(item.id); try { const result = await api.post<EvidenceViewResult>(`/sessions/${sessionId}/evidence/${item.id}/view`); setNotice(result.newClueIds.length ? `새 단서 ${result.newClueIds.length}개를 획득했습니다.` : '증거를 확인했습니다.'); await Promise.all([evidence.reload(), clues.reload(), session.reload()]); } catch (error) { setActionError(error as ApiError); } finally { setBusy(''); } }
  async function deduction() { setBusy('deduction'); try { await api.post(`/sessions/${sessionId}/enter-deduction`); router.push(`/game/${sessionId}/deduction`); } catch (error) { setActionError(error as ApiError); setBusy(''); } }
  if (session.loading) return <LoadingState label="게임 세션을 복구하는 중..." />;
  const totalQuestions = episode.data?.difficulties.find((item) => item.difficulty === session.data?.difficulty)?.totalQuestions;

  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100"><div className="mx-auto max-w-5xl space-y-7">{session.error ? <ErrorState error={session.error} retry={session.reload} /> : session.data && <>
    <header className="flex flex-wrap justify-between gap-3"><div><p className="text-xs text-evidence-red">{session.data.status} · {session.data.difficulty}</p><h1 className="font-display text-4xl">{episode.data?.title ?? '사건 수사'}</h1></div><Link href={`/game/${sessionId}/records`} className="border border-brass-600/40 px-4 py-2">사건 기록</Link></header>
    <SessionProgressBar totalQuestionsLeft={session.data.remainingQuestions} totalQuestions={totalQuestions} cluesFound={session.data.acquiredClueCount} remainingSeconds={session.data.remainingSeconds}/>
    {terminalMessage[session.data.status] && <div className="border border-evidence-red/50 bg-evidence-red/10 p-4">{terminalMessage[session.data.status]} {session.data.status === 'COMPLETED' && <Link className="ml-2 underline" href={`/game/${sessionId}/result`}>결과 보기</Link>}</div>}
    {notice && <p role="status" className="border border-brass-400 bg-brass-600/10 p-3">{notice}</p>}{actionError && <ErrorState error={actionError}/>} 
    <section><h2 className="mb-3 font-display text-2xl">열람 가능한 증거</h2>{!evidence.data?.length ? <EmptyState label="현재 열람 가능한 증거가 없습니다." /> : <div className="grid gap-3 md:grid-cols-2">{evidence.data.map((item) => <button key={item.id} type="button" onClick={() => view(item)} disabled={Boolean(busy) || Boolean(terminalMessage[session.data!.status])} className="border border-brass-600/30 bg-noir-900/60 p-4 text-left disabled:opacity-50"><b>{item.title}</b><span className="float-right text-xs">{item.viewedAt ? '열람 완료' : '열람 가능'}</span><p className="mt-2 text-sm opacity-60">{item.description}</p></button>)}</div>}</section>
    <section><h2 className="mb-3 font-display text-2xl">심문할 용의자</h2>{suspects.loading ? <LoadingState /> : !suspects.data?.length ? <EmptyState label="용의자 정보가 없습니다." /> : <div className="grid gap-4 md:grid-cols-2">{suspects.data.map((suspect) => <SuspectStatusCard key={suspect.id} suspect={suspect} state={session.data!.suspectStates.find((item) => item.suspectId === suspect.id)} onSelect={choose} disabled={Boolean(busy) || Boolean(terminalMessage[session.data!.status]) || session.data!.remainingQuestions === 0}/>)}</div>}</section>
    <button type="button" onClick={deduction} disabled={Boolean(busy) || Boolean(terminalMessage[session.data.status])} className="w-full bg-evidence-red py-4 font-display text-lg font-bold disabled:opacity-40">최종 추리로 이동</button>
  </>}</div></main></AuthGuard>;
}
