import type { DifficultyOption, Region } from "@/features/region/types";

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { id: "easy", label: "쉬움", questionsPerSuspect: 3, description: "일반적인 지역 사투리" },
  { id: "normal", label: "보통", questionsPerSuspect: 2, description: "일반적인 지역 사투리" },
  { id: "hard", label: "매우매우 어려움", questionsPerSuspect: 1, description: "강한 사투리와 생략 표현" },
];

export const REGIONS: Region[] = [
  {
    id: "gyeongsang",
    name: "경상도",
    markerPosition: { top: "52%", left: "68%" },
    case: {
      id: "gyeongsang-jongga",
      title: "종가의 밤",
      subtitle: "안동 종가 대주 살인 사건",
      description: "시제를 하루 앞둔 밤, 17대 종가의 대주가 사랑채에서 숨진 채 발견됐다. 37년 세월의 응어리를 파헤쳐라.",
    },
  },
  {
    id: "jeolla",
    name: "전라도",
    markerPosition: { top: "68%", left: "36%" },
    case: {
      id: "jeolla-sakhim",
      title: "삭힌 진실",
      subtitle: "나주 홍어 가공업체 대표 살인 사건",
      description: "성수기를 앞둔 발효창고에서 대표가 숨진 채 발견됐다. 사고사로 위장된 살인의 진실을 밝혀라.",
    },
  },
  {
    id: "chungcheong",
    name: "충청도",
    markerPosition: { top: "34%", left: "44%" },
    case: {
      id: "chungcheong-jeongjanamu",
      title: "정자나무집의 불",
      subtitle: "부여 백숙집 화재·살인 사건",
      description: "한밤중 화재로 불탄 식당에서 사장이 숨진 채 발견됐다. 단순 화재가 아닌 살인 후 방화의 흔적을 쫓아라.",
    },
  },
  {
    id: "jeju",
    name: "제주도",
    markerPosition: { top: "93%", left: "26%" },
    case: {
      id: "jeju-aewol",
      title: "애월 별장의 마지막 차",
      subtitle: "애월 자산가 독살 사건",
      description: "해안가 별장 서재에서 자산가가 차를 마신 채 숨졌다. 사라진 비밀 장부와 함께 감춰진 동기를 추적하라.",
    },
  },
];
