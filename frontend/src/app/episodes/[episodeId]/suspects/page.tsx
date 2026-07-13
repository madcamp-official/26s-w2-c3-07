'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/ApiState';
import { SuspectSelectCard } from '@/features/suspect/components/SuspectSelectCard';
import { SuspectProfileBar } from '@/features/suspect/components/SuspectProfileBar';
import type { PublicSuspect } from '@/types/content';

export default function SuspectsPage() {
  const { episodeId } = useParams<{ episodeId: string }>();
  const resource = useApiResource<PublicSuspect[]>(`/episodes/${episodeId}/suspects`);
  const [selected, setSelected] = useState('');
  const selectedSuspect = resource.data?.find((suspect) => suspect.id === selected) ?? resource.data?.[0];
  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100"><div className="mx-auto max-w-4xl space-y-6"><Link href={`/episodes/${episodeId}`}>← 사건 개요</Link><header><p className="text-xs text-evidence-red">SUSPECT FILES</p><h1 className="font-display text-4xl">용의자 공개 정보</h1></header>{resource.loading ? <LoadingState /> : resource.error ? <ErrorState error={resource.error} retry={resource.reload} /> : !resource.data?.length ? <EmptyState label="용의자가 없습니다." /> : <>{selectedSuspect && <SuspectProfileBar suspect={selectedSuspect}/>}<div className="grid gap-5 md:grid-cols-2">{resource.data.map((suspect) => <SuspectSelectCard key={suspect.id} suspect={suspect} isSelected={selectedSuspect?.id === suspect.id} onSelect={setSelected}/>)}</div>{selectedSuspect && <section className="border border-brass-600/30 bg-noir-900/70 p-5"><h2 className="font-display text-2xl">{selectedSuspect.name}</h2><p className="mt-3 text-sm leading-relaxed text-parchment-300/70">{selectedSuspect.publicProfile.summary ?? '공개 프로필이 없습니다.'}</p><p className="mt-2 text-xs text-parchment-300/50">피해자와의 관계: {selectedSuspect.victimRelation ?? '미상'} · 초기 감정: {selectedSuspect.initialEmotion}</p></section>}</>}</div></main></AuthGuard>;
}
