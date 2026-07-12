import type { Clue, RecordStep, Suspect, TestimonyEntry } from "@/features/records/types";

export const RECORD_STEPS: RecordStep[] = [
  { id: 1, label: "용의자 심문" },
  { id: 2, label: "단서 정리" },
  { id: 3, label: "사투리 해석" },
  { id: 4, label: "증언 교차검증" },
];

export const SUSPECTS: Suspect[] = [
  { id: "park-chunja", name: "박춘자", gender: "여", age: 54, occupation: "마을 슈퍼 운영" },
  { id: "kim-yongsik", name: "김용식", gender: "남", age: 60, occupation: "마을 어선 선장" },
  { id: "lee-cheolsu", name: "이철수", gender: "남", age: 48, occupation: "마을회관 관리" },
  { id: "choi-minho", name: "최민호", gender: "남", age: 28, occupation: "마을 청년회" },
  { id: "kang-mijeong", name: "강미정", gender: "여", age: 32, occupation: "마을 카페 운영" },
];

export const TESTIMONIES: TestimonyEntry[] = [
  { suspectId: "kim-yongsik", time: "14:02", lines: ["그날 새벽에 배 정비하러 나갔는디,", "아무도 안 보였심더."] },
  {
    suspectId: "lee-cheolsu",
    time: "14:08",
    lines: ["9시쯤 나가봤는데,", "마을회관 앞에서 어떤 사람이랑", "시끄럽게 말다툼하고 있더라구."],
  },
  { suspectId: "park-chunja", time: "14:15", lines: ["나는 그때 그냥 들어왔지예.", "별일 없겠지 싶어가꼬..."] },
  { suspectId: "choi-minho", time: "14:21", lines: ["밤새 비가 왔잖아요,", "저는 집에서 못 나갔어요."] },
  { suspectId: "kang-mijeong", time: "14:28", lines: ["카페 문 닫고 집에 가는 길이었어요.", "멀리서 소리는 들었는데 자세히는..."] },
];

export const CLUES: Clue[] = [
  { id: "broken-pot", label: "깨진 화분", status: "analyzed" },
  { id: "wet-mark", label: "젖은 자국", status: "analyzed" },
  { id: "torn-cloth", label: "찢어진 천 조각", status: "analyzed" },
  { id: "witness-memo", label: "목격자 진술 메모", status: "unanalyzed" },
];

export const TOTAL_CLUE_SLOTS = 6;
export const TOTAL_QUESTIONS = 10;
