export type ClueConditionResult = { groupNo: number; met: boolean };

export type ClueCondition = {
  groupNo: number;
  conditionType: string;
  targetRef: string | null;
  operator: 'EQ' | 'IN' | 'GTE' | 'EXISTS';
  expectedValue: unknown;
};

export type ClueEvaluationContext = {
  viewedEvidenceIds: ReadonlySet<string>;
  presentedEvidenceIds: ReadonlySet<string>;
  questionType: string | null;
  suspectId: string | null;
  usedFactIds: ReadonlySet<string>;
  revealedFactIds: ReadonlySet<string>;
  claimedFactIds: ReadonlySet<string>;
  acquiredClueIds: ReadonlySet<string>;
};

const valuesFor = (conditionType: string, context: ClueEvaluationContext): ReadonlySet<string> | null => {
  switch (conditionType) {
    case 'EVIDENCE_VIEWED': return context.viewedEvidenceIds;
    case 'EVIDENCE_PRESENTED': return context.presentedEvidenceIds;
    case 'QUESTION_TYPE_ASKED': return context.questionType ? new Set([context.questionType]) : new Set();
    case 'SUSPECT_INTERROGATED': return context.suspectId ? new Set([context.suspectId]) : new Set();
    case 'FACT_USED': return context.usedFactIds;
    case 'FACT_REVEALED': return context.revealedFactIds;
    case 'CLAIM_RECORDED': return context.claimedFactIds;
    case 'CLUE_ACQUIRED': return context.acquiredClueIds;
    default: return null;
  }
};

export function evaluateClueCondition(
  condition: ClueCondition,
  context: ClueEvaluationContext,
  onUnknown?: (conditionType: string) => void
): boolean {
  const values = valuesFor(condition.conditionType, context);
  if (!values) {
    onUnknown?.(condition.conditionType);
    return false;
  }
  const present = condition.targetRef ? values.has(condition.targetRef) : values.size > 0;
  switch (condition.operator) {
    case 'EXISTS': return present;
    case 'EQ': return typeof condition.expectedValue === 'boolean' ? present === condition.expectedValue : present;
    case 'IN': return Array.isArray(condition.expectedValue)
      ? condition.expectedValue.some((value) => typeof value === 'string' && values.has(value))
      : present;
    case 'GTE': return typeof condition.expectedValue === 'number' && values.size >= condition.expectedValue;
    default: return false;
  }
}

export function isClueUnlocked(results: ClueConditionResult[]): boolean {
  if (results.length === 0) return false;
  const groups = new Map<number, boolean[]>();
  for (const result of results) groups.set(result.groupNo, [...(groups.get(result.groupNo) ?? []), result.met]);
  return [...groups.values()].some((conditions) => conditions.every(Boolean));
}

export function evaluateClueConditions(
  conditions: ClueCondition[],
  context: ClueEvaluationContext,
  onUnknown?: (conditionType: string) => void
): boolean {
  return isClueUnlocked(conditions.map((condition) => ({
    groupNo: condition.groupNo,
    met: evaluateClueCondition(condition, context, onUnknown)
  })));
}
