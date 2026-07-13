import type { RecordStep } from "@/features/records/types";

type StepTabsProps = {
  steps: RecordStep[];
  activeStepId: number;
  onSelectStep: (id: number) => void;
};

export function StepTabs({ steps, activeStepId, onSelectStep }: StepTabsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {steps.map((step) => {
        const isActive = step.id === activeStepId;
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onSelectStep(step.id)}
            className={`flex items-center gap-2 border px-4 py-2 text-sm font-display transition-colors ${
              isActive
                ? "border-evidence-red bg-evidence-red text-parchment-100"
                : "border-brass-600/40 bg-noir-800/70 text-parchment-300/70 hover:border-brass-400"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                isActive ? "border-parchment-100" : "border-brass-600/50"
              }`}
            >
              {step.id}
            </span>
            {step.label}
          </button>
        );
      })}
    </div>
  );
}
