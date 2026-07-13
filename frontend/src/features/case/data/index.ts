import { chungcheongCase } from "@/features/case/data/chungcheong";
import { gyeongsangCase } from "@/features/case/data/gyeongsang";
import { jejuCase } from "@/features/case/data/jeju";
import { jeollaCase } from "@/features/case/data/jeolla";
import type { CaseData } from "@/features/case/types";

export const ALL_CASES: CaseData[] = [gyeongsangCase, jeollaCase, chungcheongCase, jejuCase];

export function getCaseByRegionId(regionId: string): CaseData | undefined {
  return ALL_CASES.find((c) => c.regionId === regionId);
}

export function getCaseById(caseId: string): CaseData | undefined {
  return ALL_CASES.find((c) => c.id === caseId);
}
