export type GameSession = {
  id: string;
  userId: string;
  episodeId: string;
  status: 'active' | 'completed';
};
