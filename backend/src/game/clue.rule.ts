export type ClueConditionResult = { groupNo: number; met: boolean };

export function isClueUnlocked(results: ClueConditionResult[]): boolean {
  if (results.length === 0) return false;
  const groups = new Map<number, boolean[]>();
  for (const result of results) groups.set(result.groupNo, [...(groups.get(result.groupNo) ?? []), result.met]);
  return [...groups.values()].some((conditions) => conditions.every(Boolean));
}
