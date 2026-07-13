type StickyNoteProps = {
  lines: string[];
  variant?: "yellow" | "purple";
  className?: string;
};

const VARIANT_STYLES: Record<NonNullable<StickyNoteProps["variant"]>, string> = {
  yellow: "bg-[#d9c26a] text-noir-900",
  purple: "bg-[#4a4266] text-parchment-100",
};

export function StickyNote({ lines, variant = "yellow", className = "" }: StickyNoteProps) {
  return (
    <div
      className={`w-56 -rotate-2 px-4 py-3 text-sm font-medium leading-relaxed shadow-[0_8px_20px_rgba(0,0,0,0.5)] ${VARIANT_STYLES[variant]} ${className}`}
    >
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}
