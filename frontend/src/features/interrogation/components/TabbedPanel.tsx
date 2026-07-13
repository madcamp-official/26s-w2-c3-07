import type { ReactNode } from "react";

type TabbedPanelProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function TabbedPanel({ label, children, className = "" }: TabbedPanelProps) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute -top-4 left-6 border border-brass-600/50 bg-[#e9dfc7] px-3 py-1 text-xs font-bold text-noir-900 shadow-[0_4px_10px_rgba(0,0,0,0.4)]">
        {label}
      </span>
      <div className="border border-brass-600/40 bg-noir-900/85 px-6 pb-4 pt-6">{children}</div>
    </div>
  );
}
