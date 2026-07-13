import type { ConversationRecord, Suspect } from "@/features/case/types";

type TestimonyLogPanelProps = {
  conversations: ConversationRecord[];
  suspects: Suspect[];
  highlightedSuspectId: string;
};

export function TestimonyLogPanel({ conversations, suspects, highlightedSuspectId }: TestimonyLogPanelProps) {
  const suspectById = new Map(suspects.map((s) => [s.id, s]));

  const entries = conversations
    .filter((c) => c.messages.some((m) => m.role === "suspect"))
    .flatMap((c) =>
      c.messages
        .filter((m) => m.role === "suspect")
        .map((m) => ({ suspectId: c.suspectId, message: m })),
    );

  return (
    <div className="border border-brass-600/40 bg-[#e9dfc7] p-5">
      <p className="mb-4 font-display text-lg text-noir-900">심문 기록</p>

      {entries.length === 0 ? (
        <p className="text-sm text-noir-900/50">아직 심문한 내용이 없습니다. 용의자를 심문하면 여기에 기록됩니다.</p>
      ) : (
        <div className="max-h-[28rem] space-y-4 overflow-y-auto pr-1">
          {entries.map(({ suspectId, message }) => {
            const suspect = suspectById.get(suspectId);
            const isHighlighted = suspectId === highlightedSuspectId;
            return (
              <div
                key={message.id}
                className={`relative flex items-start gap-3 border bg-[#f4ecd8] p-3 ${
                  isHighlighted ? "border-evidence-red" : "border-noir-900/10"
                }`}
              >
                {isHighlighted && (
                  <span
                    aria-hidden
                    className="absolute -right-2 -top-2 h-3 w-3 rounded-full bg-evidence-red shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                  />
                )}
                <span className="h-12 w-12 shrink-0 bg-[radial-gradient(circle_at_35%_30%,#5a4f40_0%,#2a2318_60%,#100d09_100%)]" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-bold text-noir-900">{suspect?.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-noir-900/80">&ldquo;{message.text}&rdquo;</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
