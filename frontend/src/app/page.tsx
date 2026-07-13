import { CaseFileCard } from "@/components/home/CaseFileCard";
import { MarqueeStrip } from "@/components/home/MarqueeStrip";
import { MenuButton } from "@/components/home/MenuButton";
import { StickyNote } from "@/components/home/StickyNote";
import { SuspectPolaroids } from "@/components/home/SuspectPolaroids";
import { TestimonyCard } from "@/components/home/TestimonyCard";
import { AlleyBackground } from "@/components/layout/AlleyBackground";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-noir-950">
      <AlleyBackground />

      <div className="relative flex flex-1 flex-col justify-between gap-8 px-6 py-10 md:px-16 md:py-12">
        {/* 상단 영역 */}
        <div className="flex items-start justify-between gap-6">
          <CaseFileCard />
          <SuspectPolaroids />
        </div>

        {/* 중앙 타이틀 & 메뉴 */}
        <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
          <p className="font-display text-2xl text-parchment-100 md:text-3xl">탐정님,</p>
          <h1 className="mt-1 font-display text-4xl font-bold text-parchment-100 md:text-5xl">
            그 뜻이 아니예라
          </h1>
          <p className="mt-4 text-sm text-brass-400 md:text-base">
            사투리 속 <span className="text-evidence-red">진실</span>을 파헤치는 심문 추리 게임
          </p>

          <nav className="mt-10 flex w-full flex-col gap-4">
            <MenuButton label="사건 수사 시작" href="/login" />
            <MenuButton label="수사 기록 보기" />
            <MenuButton label="사투리 기록집" />
          </nav>

          <div className="mt-6 flex items-center gap-6 text-sm text-parchment-300/70">
            <button type="button" className="transition-colors hover:text-parchment-100">
              ⚙ 설정
            </button>
            <button type="button" className="transition-colors hover:text-parchment-100">
              ⏻ 로그아웃
            </button>
          </div>
        </div>

        {/* 하단 영역 */}
        <div className="flex items-end justify-between gap-6 pb-4">
          <div className="flex flex-col gap-4">
            <StickyNote lines={["어디서 본 것 같은데", "어떤 사람이랑", "얘기했던가?"]} variant="yellow" />
            <StickyNote lines={["모두 의심스럽다", "단서를 찾아라"]} variant="purple" className="-rotate-3" />
          </div>
          <TestimonyCard />
        </div>
      </div>

      <div className="relative">
        <MarqueeStrip />
      </div>
    </main>
  );
}
