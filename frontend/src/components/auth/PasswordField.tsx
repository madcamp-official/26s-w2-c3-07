"use client";

import { useState } from "react";

export function PasswordField() {
  const [visible, setVisible] = useState(false);

  return (
    <div className="text-left">
      <label htmlFor="password" className="mb-2 block text-sm text-parchment-300">
        비밀번호
      </label>
      <div className="relative">
        <input
          id="password"
          type={visible ? "text" : "password"}
          placeholder="비밀번호를 입력하세요"
          className="w-full border border-brass-600/30 bg-noir-900/80 px-4 py-3 pr-11 text-sm text-parchment-100 placeholder:text-parchment-300/40 focus:border-brass-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "비밀번호 숨기기" : "비밀번호 표시"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-parchment-300/60 hover:text-parchment-100"
        >
          {visible ? "🙈" : "👁"}
        </button>
      </div>
    </div>
  );
}
