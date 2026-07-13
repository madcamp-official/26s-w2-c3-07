import type { DifficultyOption, Region } from "@/features/region/types";

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { id: "easy", label: "쉬움", questionsPerSuspect: 3, description: "일반적인 지역 사투리" },
  { id: "normal", label: "보통", questionsPerSuspect: 2, description: "일반적인 지역 사투리" },
  { id: "hard", label: "매우매우 어려움", questionsPerSuspect: 1, description: "강한 사투리와 생략 표현" },
];

export const REGIONS: Region[] = [
  { id: "gyeongsang", name: "경상도", markerPosition: { top: "52%", left: "68%" } },
  { id: "jeolla", name: "전라도", markerPosition: { top: "68%", left: "36%" } },
  { id: "chungcheong", name: "충청도", markerPosition: { top: "34%", left: "44%" } },
  { id: "jeju", name: "제주도", markerPosition: { top: "93%", left: "26%" } },
];
