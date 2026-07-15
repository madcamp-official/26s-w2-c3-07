"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-noir-950 px-6 text-center text-parchment-100">
      <h1 className="font-display text-2xl">사건 조사 중 문제가 발생했습니다</h1>
      <p className="text-sm text-parchment-300/70">화면을 표시하지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      <button
        type="button"
        onClick={reset}
        className="border border-brass-600/60 px-4 py-2 text-sm hover:border-brass-400"
      >
        다시 시도
      </button>
    </main>
  );
}
