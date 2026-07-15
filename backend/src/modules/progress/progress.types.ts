export type RegionRef = { id: string; code: string; name: string };
export type EpisodeRef = { id: string; code: string; title: string; region: RegionRef };
export type SuspectRef = { id: string; code: string; name: string };
export type ProgressState = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export type EpisodeProgressDto = {
  episodeId: string;
  episodeCode: string;
  title: string;
  region: RegionRef;
  state: ProgressState;
  bestDifficulty: string | null;
  bestScore: number | null;
  firstClearedAt: string | null;
  lastPlayedAt: string | null;
  unlockedAt: string | null;
};

export type HistoryItem = {
  sessionId: string;
  episode: EpisodeRef;
  difficulty: string;
  selectedSuspect: SuspectRef;
  isCorrect: boolean;
  resolutionType: 'FULL_RESOLUTION' | 'CULPRIT_CORRECT' | 'WRONG_SUSPECT';
  score: number;
  startedAt: string;
  completedAt: string;
};

export type HistoryPage = {
  items: HistoryItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type DialectProgressDto = {
  expression: string;
  standardMeaning: string;
  usageContext: string | null;
  region: RegionRef;
  episode: { id: string; code: string; title: string } | null;
  unlockedAt: string;
};

export type ProgressSummary = {
  playedEpisodeCount: number;
  completedEpisodeCount: number;
  solvedEpisodeCount: number;
  unresolvedEpisodeCount: number;
  currentStreak: number;
  correctCount: number;
  fullResolutionCount: number;
  regionProgress: Array<{ region: RegionRef; totalEpisodes: number; playedEpisodes: number; solvedEpisodes: number }>;
  recentPlays: HistoryItem[];
  unlockedDialectCount: number;
};

export type ResultStats = { correctCount: number; fullResolutionCount: number; completedEpisodeIds: string[]; solvedEpisodeIds: string[]; currentStreak: number };
