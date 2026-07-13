import type { InterrogationMessage } from '@/types/interrogation';
import { TabbedPanel } from '@/features/interrogation/components/TabbedPanel';

export function ConversationLog({ messages }: { messages: InterrogationMessage[] }) {
  return <TabbedPanel label="심문 기록">
    {messages.length === 0 ? <p className="text-base leading-relaxed text-parchment-300/60">아직 심문 기록이 없습니다. 아래 입력창에 질문을 입력하세요.</p> : <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
      {messages.map((message) => <article key={message.id} className="space-y-2"><div className="ml-auto max-w-[85%] bg-evidence-red/15 px-3 py-2 text-right text-sm leading-relaxed text-brass-200">{message.question}</div><div className="max-w-[85%]"><p className="mb-1 text-xs italic text-parchment-300/50">({message.emotion})</p><div className="bg-noir-800/80 px-3 py-2 text-sm leading-relaxed text-parchment-100">{message.dialectResponse}</div></div></article>)}
    </div>}
  </TabbedPanel>;
}
