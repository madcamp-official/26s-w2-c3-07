'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthGuard } from '@/features/auth/AuthProvider';
import { useApiResource } from '@/features/api/useApiResource';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/ApiState';
import { HistoryRecordCard } from '@/features/progress/components/HistoryRecordCard';
import type { HistoryPage } from '@/types/progress';

export default function HistoryPage() {
  const search = useSearchParams(); const page = Math.max(1, Number(search.get('page') ?? 1));
  const data = useApiResource<HistoryPage>(`/progress/history?page=${page}&pageSize=10`);
  return <AuthGuard><main className="min-h-screen bg-noir-950 px-6 py-10 text-parchment-100"><div className="mx-auto max-w-3xl space-y-6"><Link href="/profile">← 프로필</Link><header><p className="text-xs text-evidence-red">CASE HISTORY</p><h1 className="font-display text-4xl">플레이 이력</h1></header>{data.loading ? <LoadingState/> : data.error ? <ErrorState error={data.error}/> : !data.data?.items.length ? <EmptyState label="완료한 플레이가 없습니다."/> : <>{data.data.items.map((item) => <HistoryRecordCard key={item.sessionId} record={item}/>)}<nav className="flex justify-between"><Link aria-disabled={page <= 1} className={page <= 1 ? 'pointer-events-none opacity-30' : ''} href={`?page=${page - 1}`}>← 이전</Link><span>{page} / {data.data.totalPages || 1}</span><Link aria-disabled={page >= data.data.totalPages} className={page >= data.data.totalPages ? 'pointer-events-none opacity-30' : ''} href={`?page=${page + 1}`}>다음 →</Link></nav></>}</div></main></AuthGuard>;
}
