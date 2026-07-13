const CASE_INFO = [
  { label: "피해자", value: "이◯◯ (남, 54세)" },
  { label: "사건 일자", value: "2024.05.17" },
  { label: "발생 장소", value: "경상도 마을" },
  { label: "현재 용의자", value: "5명" },
];

export function CaseFileCard() {
  return (
    <div className="w-64 -rotate-1 border border-brass-600/40 bg-noir-800/80 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
      <div className="mb-4 flex items-start justify-between gap-2">
        <p className="font-display text-lg leading-snug text-parchment-100">
          사건 기록
          <br />
          파일
        </p>
        <span className="mt-1 shrink-0 -rotate-6 border-2 border-evidence-red px-2 py-0.5 text-xs font-bold tracking-widest text-evidence-red">
          기밀
        </span>
      </div>

      <dl className="space-y-1.5 border-t border-brass-600/30 pt-3 text-sm text-parchment-300">
        {CASE_INFO.map((item) => (
          <div key={item.label} className="flex gap-2">
            <dt className="text-brass-400">· {item.label}:</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 space-y-1 border-t border-brass-600/30 pt-3">
        <div className="h-px bg-brass-600/20" />
        <div className="h-px bg-brass-600/20" />
        <div className="h-px bg-brass-600/20" />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-parchment-300/70">
        용의자들의 사투리를
        <br />
        꼼꼼히 기록할 것.
      </p>
    </div>
  );
}
