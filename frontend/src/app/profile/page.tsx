'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthGuard, useAuth } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { ErrorState, LoadingState } from '@/components/ui/ApiState';
import type { ProgressSummary } from '@/types/progress';
import { AppHeader } from '@/components/layout/AppHeader';
export default function ProfilePage(){const auth=useAuth();const router=useRouter();const progress=useApiResource<ProgressSummary>('/progress');async function logout(){await auth.signOut();router.replace('/login')}
return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100"><div className="mx-auto max-w-3xl space-y-6"><AppHeader /><Link href="/regions">← 사건 목록</Link><header><p className="text-xs text-evidence-red">DETECTIVE PROFILE</p><h1 className="font-display text-4xl">{auth.profile?.displayName??'탐정'}님의 기록</h1></header>{progress.loading?<LoadingState/>:progress.error?<ErrorState error={progress.error}/>:progress.data&&<><section className="grid grid-cols-2 gap-3 md:grid-cols-4">{[['플레이',progress.data.playedEpisodeCount],['완료',progress.data.completedEpisodeCount],['해결',progress.data.solvedEpisodeCount],['완전 해결',progress.data.fullResolutionCount]].map(([l,v])=><div key={l} className="border p-4 text-center"><b className="text-2xl text-brass-400">{v}</b><p>{l}</p></div>)}</section><nav className="grid gap-3 md:grid-cols-3"><Link className="border p-4" href="/profile/progress">지역별 진행도</Link><Link className="border p-4" href="/profile/history">플레이 이력</Link><Link className="border p-4" href="/profile/dialects">사투리 기록집 ({progress.data.unlockedDialectCount})</Link></nav><Link href="/settings" className="block border border-brass-600/30 p-4 text-center">⚙ 닉네임·효과음·텍스트 속도 설정</Link></>}<button onClick={logout} className="w-full border border-brass-600/30 py-3">로그아웃</button></div></main></AuthGuard>}
