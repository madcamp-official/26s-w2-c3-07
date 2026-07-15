'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/ApiState';
import type { PublicSuspect } from '@/types/content';
import { AppHeader } from '@/components/layout/AppHeader';
import { SuspectImage } from '@/features/suspect/components/SuspectImage';

export default function SuspectsPage() {
  const { episodeId } = useParams<{ episodeId: string }>();
  const resource = useApiResource<PublicSuspect[]>(`/episodes/${episodeId}/suspects`);
  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100"><div className="mx-auto max-w-4xl space-y-6">
    <AppHeader /><Link href={`/episodes/${episodeId}`}>← 사건 개요</Link><h1 className="font-display text-4xl">용의자 공개 정보</h1>
    {resource.loading ? <LoadingState /> : resource.error ? <ErrorState error={resource.error} retry={resource.reload} message="용의자 정보를 불러오지 못했습니다." /> : !resource.data?.length ? <EmptyState label="용의자가 없습니다." /> : <div className="grid gap-5 md:grid-cols-2">
      {resource.data.map((suspect) => <article key={suspect.id} className="overflow-hidden border border-brass-600/30 bg-noir-900/70">
        <SuspectImage imageUrl={suspect.imageUrl} name={suspect.name} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[16/10] w-full" />
        <div className="p-5"><p className="text-xs text-evidence-red">{suspect.code}</p><h2 className="mt-1 font-display text-2xl">{suspect.name}</h2><p className="text-sm opacity-60">{suspect.age === null ? '나이 미상' : `${suspect.age}세`} · {suspect.occupation ?? '직업 미상'}</p><p className="mt-3 text-sm">{suspect.publicProfile.summary ?? '공개된 설명이 없습니다.'}</p><p className="mt-4 border-t border-brass-600/30 pt-3 text-sm"><span className="text-brass-400">피해자와의 관계:</span> {suspect.victimRelation ?? '확인되지 않음'}</p></div>
      </article>)}
    </div>}
  </div></main></AuthGuard>;
}
