export function CaseFileTeaser() {
  return (
    <div className="w-52 rotate-1 border border-brass-600/40 bg-noir-800/80 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
      <div className="mb-4 flex justify-end">
        <span className="-rotate-6 border-2 border-evidence-red px-2 py-0.5 text-xs font-bold tracking-widest text-evidence-red">
          기밀
        </span>
      </div>

      <p className="font-display text-base text-parchment-100">수사 자료</p>

      <div className="mt-3 space-y-2 border-t border-brass-600/30 pt-3 text-sm text-parchment-300/70">
        <p>기존은 진실을 품고있다...</p>
        <p className="flex items-center gap-1.5">
          코드
          <span className="h-3 w-10 rounded-sm bg-parchment-300/30 blur-[2px]" />
          <span className="h-3 w-10 rounded-sm bg-parchment-300/30 blur-[2px]" />
          -1943
        </p>
      </div>
    </div>
  );
}
