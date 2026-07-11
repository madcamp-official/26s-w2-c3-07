import Link from "next/link";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { PasswordField } from "@/components/auth/PasswordField";

export function LoginPanel() {
  return (
    <div className="relative w-full max-w-md border border-brass-600/50 bg-noir-800/90 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-sm md:p-10">
      <span aria-hidden className="absolute left-3 top-3 h-4 w-4 border-l border-t border-brass-500/70" />
      <span aria-hidden className="absolute right-3 top-3 h-4 w-4 border-r border-t border-brass-500/70" />
      <span aria-hidden className="absolute bottom-3 left-3 h-4 w-4 border-b border-l border-brass-500/70" />
      <span aria-hidden className="absolute bottom-3 right-3 h-4 w-4 border-b border-r border-brass-500/70" />

      <div className="mb-8 flex items-center justify-center gap-3 text-brass-400">
        <span aria-hidden>◈</span>
        <span className="h-px w-8 bg-brass-600/40" />
        <h1 className="font-display text-2xl text-parchment-100">수사관 신원 확인</h1>
        <span className="h-px w-8 bg-brass-600/40" />
        <span aria-hidden>◈</span>
      </div>

      <form className="space-y-5">
        <AuthTextField id="email" type="email" label="이메일" placeholder="이메일을 입력하세요" />
        <PasswordField />

        <label className="flex items-center gap-2 text-sm text-parchment-300">
          <input
            type="checkbox"
            className="h-4 w-4 border border-brass-600/50 bg-noir-900 accent-evidence-red"
          />
          로그인 상태 유지
        </label>

        <button
          type="submit"
          className="w-full bg-evidence-red py-3.5 font-display text-base font-bold tracking-wide text-parchment-100 transition-colors hover:bg-[#c94539]"
        >
          신원 확인
        </button>
      </form>

      <div className="my-6 flex items-center gap-4 text-xs text-parchment-300/50">
        <span className="h-px flex-1 bg-brass-600/20" />
        또는
        <span className="h-px flex-1 bg-brass-600/20" />
      </div>

      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 border border-brass-600/30 bg-noir-900/60 py-3.5 text-sm text-parchment-100 transition-colors hover:border-brass-400"
      >
        <span aria-hidden className="font-bold text-[#4285F4]">
          G
        </span>
        Google로 로그인
      </button>

      <p className="mt-6 text-center text-sm text-parchment-300/70">
        아직 등록되지 않은 수사관이십니까?{" "}
        <Link href="/signup" className="text-brass-400 underline-offset-2 hover:underline">
          수사관 등록하기
        </Link>
      </p>
    </div>
  );
}
