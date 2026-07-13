'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { api } from '@/lib/api-client';
import { ErrorState, LoadingState } from '@/components/ui/ApiState';
import type { PublicSuspect } from '@/types/content';
import type { SessionView } from '@/types/session';
import type { DeductionResult } from '@/types/deduction';
import { ApiError } from '@/types/api';
export default function DeductionPage() { const { sessionId } = useParams<{sessionId:string}>(); const router=useRouter(); const session=useApiResource<SessionView>(`/sessions/${sessionId}`); const suspects=useApiResource<PublicSuspect[]>(session.data ? `/episodes/${session.data.episodeId}/suspects` : null); const [selected,setSelected]=useState(''); const [confirm,setConfirm]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState<ApiError|null>(null);
  const sessionStatus = session.data?.status; const reloadSession = session.reload;
  useEffect(()=>{ if(sessionStatus && !['DEDUCTION','COMPLETED'].includes(sessionStatus)) void api.post(`/sessions/${sessionId}/enter-deduction`).then(()=>reloadSession()).catch((e)=>setError(e)); },[reloadSession,sessionId,sessionStatus]);
  async function submit(){if(!selected||busy)return;if(!confirm){setConfirm(true);return;}setBusy(true);setError(null);try{await api.post<DeductionResult>(`/sessions/${sessionId}/deduction`,{suspectId:selected});router.replace(`/game/${sessionId}/result`);}catch(e){setError(e as ApiError);setBusy(false)}}
  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100"><div className="mx-auto max-w-3xl space-y-7"><Link href={`/game/${sessionId}`}>← 사건으로</Link><header className="text-center"><p className="text-xs text-evidence-red">FINAL DEDUCTION</p><h1 className="font-display text-4xl">범인을 지목하세요</h1><p className="mt-2 opacity-60">정답 판정은 서버에서 한 번만 수행됩니다.</p></header>{session.loading||suspects.loading?<LoadingState/>:error?<ErrorState error={error}/>:<div className="grid gap-4 md:grid-cols-2">{suspects.data?.map(s=><button key={s.id} onClick={()=>{setSelected(s.id);setConfirm(false)}} className={`border p-5 text-left ${selected===s.id?'border-evidence-red bg-evidence-red/20':'border-brass-600/30'}`}><h2 className="font-display text-2xl">{s.name}</h2><p className="text-sm opacity-60">{s.occupation}</p></button>)}</div>}<button onClick={submit} disabled={!selected||busy} className="w-full bg-evidence-red py-4 font-bold disabled:opacity-40">{busy?'판정 중...':confirm?'최종 제출':'이 용의자 지목'}</button></div></main></AuthGuard>; }
