export type PublicProfile = { summary?: string };
export type PublicSuspect = { id: string; code: string; name: string; age: number | null; occupation: string | null; publicProfile: PublicProfile; personality: string | null; victimRelation: string | null; initialEmotion: string; displayOrder: number; imageUrl: string | null };
export type SuspectRecord = PublicSuspect & { episodeId: string };
