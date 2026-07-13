import type { Message } from "@/features/case/types";
import { TabbedPanel } from "@/features/interrogation/components/TabbedPanel";

const EMOTION_LABEL: Record<string, string> = {
  calm: "(담담하게)",
  nervous: "(불안하게)",
  hostile: "(적대적으로)",
  sad: "(슬프게)",
  deflect: "(회피하며)",
  angry: "(화를 내며)",
  shocked: "(당황하며)",
  defensive: "(방어적으로)",
};

export function ConversationLog({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    return (
      <TabbedPanel label="현재 진술">
        <p className="text-base leading-relaxed text-parchment-300/60">
          아직 질문하지 않았습니다. 아래 입력창에 질문을 입력하세요.
        </p>
      </TabbedPanel>
    );
  }

  return (
    <TabbedPanel label="심문 기록">
      <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {messages.map((message) => (
          <div key={message.id} className={message.role === "detective" ? "text-right" : "text-left"}>
            {message.role === "suspect" && (
              <p className="mb-0.5 text-xs italic text-parchment-300/50">{EMOTION_LABEL[message.emotion] ?? ""}</p>
            )}
            <p
              className={`inline-block max-w-[85%] px-3 py-2 text-sm leading-relaxed ${
                message.role === "detective"
                  ? "bg-evidence-red/15 text-brass-200"
                  : "bg-noir-800/80 text-parchment-100"
              }`}
            >
              {message.text}
            </p>
          </div>
        ))}
      </div>
    </TabbedPanel>
  );
}
