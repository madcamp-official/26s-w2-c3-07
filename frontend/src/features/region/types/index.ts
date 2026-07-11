export type RegionId = "gyeongsang" | "jeolla" | "chungcheong" | "jeju";

export type CaseDifficulty = 1 | 2 | 3;

export type CaseSummary = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  difficulty: CaseDifficulty;
};

export type Region = {
  id: RegionId;
  name: string;
  /** SVG viewBox 기준 지역 마커 좌표 (%) */
  markerPosition: { top: string; left: string };
  case: CaseSummary;
};
