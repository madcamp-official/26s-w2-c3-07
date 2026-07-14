const REGION_PREFIX_IMAGE: Record<string, string> = {
  GS: '/images/episodes/gyeongsang.png',
  JL: '/images/episodes/jeolla.png',
  CC: '/images/episodes/chungcheong.png',
  JJ: '/images/episodes/jeju.png',
};

export function resolveEpisodeImage(episode: { code: string; imageUrl: string | null }): string | null {
  if (episode.imageUrl) return episode.imageUrl;
  const prefix = episode.code.split('-')[0];
  return REGION_PREFIX_IMAGE[prefix] ?? null;
}
