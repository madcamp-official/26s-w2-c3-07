import type { EpisodeDetail } from '@/types/content';

export function VictimSummaryCard({ victim }: { victim: EpisodeDetail['victim'] }) {
  return <section className="border border-brass-600/40 bg-[#e9dfc7] p-6 text-noir-900">
    <p className="text-xs font-bold tracking-widest text-evidence-red">피해자</p>
    <h2 className="mt-1 font-display text-xl font-bold">{victim.name} ({victim.age ? `${victim.age}세` : '나이 미상'} · {victim.occupation ?? '직업 미상'})</h2>
    {typeof victim.profile === 'object' && victim.profile !== null && 'summary' in victim.profile && <p className="mt-4 text-sm leading-relaxed text-noir-900/80">{String(victim.profile.summary)}</p>}
  </section>;
}
