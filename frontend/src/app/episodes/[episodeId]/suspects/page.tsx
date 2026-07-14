'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/ApiState';
import { SuspectImage } from '@/features/suspect/components/SuspectImage';
import { AppHeader } from '@/components/layout/AppHeader';
import type { PublicSuspect } from '@/types/content';
export default function SuspectsPage() { const { episodeId } = useParams<{ episodeId: string }>(); const resource = useApiResource<PublicSuspect[]>(`/episodes/${episodeId}/suspects`); return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100"><div className="mx-auto max-w-4xl space-y-6"><AppHeader /><Link href={`/episodes/${episodeId}`}>← 사건 개요</Link><h1 className="font-display text-4xl">용의자 공개 정보</h1>{resource.loading ? <LoadingState /> : resource.error ? <ErrorState error={resource.error} retry={resource.reload} /> : !resource.data?.length ? <EmptyState label="용의자가 없습니다." /> : <div className="grid gap-5 md:grid-cols-2">{resource.data.map((suspect) => <article key={suspect.id} className="overflow-hidden border border-brass-600/30 bg-noir-900/70"><SuspectImage imageUrl={suspect.imageUrl} name={suspect.name} sizes="(min-width: 768px) 50vw, 100vw" className="aspect-[16/10] w-full" /><div className="p-5"><p className="text-xs text-evidence-red">{suspect.code}</p><h2 className="mt-1 font-display text-2xl">{suspect.name}</h2><p className="text-sm opacity-60">{suspect.age ?? '나이 미상'}세 · {suspect.occupation}</p><p className="mt-3 text-sm">{suspect.publicProfile.summary}</p><p className="mt-2 text-xs opacity-50">피해자 관계: {suspect.victimRelation ?? '미상'} · 초기 감정: {suspect.initialEmotion}</p></div></article>)}</div>}</div></main></AuthGuard>; }
