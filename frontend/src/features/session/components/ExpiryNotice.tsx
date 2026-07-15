export function ExpiryNotice() {
  return <div role="dialog" aria-modal="true" aria-label="심문 시간 종료" className="fixed inset-0 z-[60] grid place-items-center bg-noir-950/90 p-6"><div className="w-full max-w-lg border border-evidence-red/50 bg-noir-900 p-6 text-center"><h2 className="font-display text-2xl">심문 시간이 종료되었습니다.</h2><p className="mt-3 opacity-70">지금까지 수집한 증거와 단서를 바탕으로 최종 추리를 진행해 주세요.</p><p className="mt-4 text-sm text-brass-400">용의자 선택 화면으로 이동합니다.</p></div></div>;
}
