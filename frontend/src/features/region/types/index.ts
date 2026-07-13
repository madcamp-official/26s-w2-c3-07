export type RegionId = "gyeongsang" | "jeolla" | "chungcheong" | "jeju";

export type DifficultyId = "easy" | "normal" | "hard";

export type DifficultyOption = {
  id: DifficultyId;
  label: string;
  questionsPerSuspect: number;
  description: string;
};

export type Region = {
  id: RegionId;
  name: string;
  /** SVG viewBox 기준 지역 마커 좌표 (%) */
  markerPosition: { top: string; left: string };
};
