import type { ButtonHTMLAttributes } from "react";

type MenuButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
};

export function MenuButton({ label, className = "", ...props }: MenuButtonProps) {
  return (
    <button
      type="button"
      className={`w-full border border-brass-600/60 bg-noir-800/90 py-4 font-display text-lg tracking-wide text-parchment-100 transition-colors hover:border-brass-400 hover:bg-noir-700/90 ${className}`}
      {...props}
    >
      {label}
    </button>
  );
}
