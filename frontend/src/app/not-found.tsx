import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-noir-950 px-6 text-center text-parchment-100">
      <h1 className="font-display text-2xl">이 사건은 기록에 없습니다</h1>
      <p className="text-sm text-parchment-300/70">요청하신 페이지를 찾을 수 없습니다.</p>
      <Link href="/" className="border border-brass-600/60 px-4 py-2 text-sm hover:border-brass-400">
        수사 본부로 돌아가기
      </Link>
    </main>
  );
}
