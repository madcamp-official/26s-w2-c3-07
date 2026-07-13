import type { PublicSuspect } from '@/types/content';

export function SuspectPreviewStrip({ suspects }: { suspects: PublicSuspect[] }) {
  return <section>
    <h2 className="mb-3 font-display text-lg text-parchment-100">용의자 ({suspects.length})</h2>
    <div className="flex flex-wrap gap-3">{suspects.map((suspect) => <div key={suspect.id} className="border border-brass-600/30 bg-noir-900/60 px-4 py-2 text-sm text-parchment-200">
      {suspect.name} · {suspect.age ? `${suspect.age}세` : '나이 미상'} · {suspect.occupation ?? '직업 미상'}
    </div>)}</div>
  </section>;
}
