import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../src');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => { const path = join(directory, name); return statSync(path).isDirectory() ? sourceFiles(path) : /\.(ts|tsx)$/.test(name) ? [path] : []; });
}

describe('frontend API integration contracts', () => {
  it('submits login and displays failures', () => { const source = read('components/auth/LoginPanel.tsx'); expect(source).toContain('await signIn'); expect(source).toContain('role="alert"'); expect(source).toContain("new URLSearchParams(window.location.search).get('next') || '/regions'"); });
  it('creates a session and navigates with the returned UUID', () => { const source = read('app/episodes/[episodeId]/page.tsx'); expect(source).toContain("api.post<SessionView>('/sessions'"); expect(source).toContain('session.sessionId'); });
  it('selects a suspect through the API before navigation', () => { const source = read('app/game/[sessionId]/page.tsx'); expect(source).toContain('/current-suspect'); expect(source.indexOf('/current-suspect')).toBeLessThan(source.indexOf('router.push(`/game/${sessionId}/interrogation')); });
  it('creates an interrogation request id and prevents duplicate submission', () => { const source = read('app/game/[sessionId]/interrogation/[suspectId]/page.tsx'); expect(source).toContain('crypto.randomUUID()'); expect(source).toContain('if (disabled'); expect(source).toContain('remainingQuestions <= 0'); });
  it('passes the viewed evidence UUID without changing the evidence card UI', () => { const game = read('app/game/[sessionId]/page.tsx'); const interrogation = read('app/game/[sessionId]/interrogation/[suspectId]/page.tsx'); expect(game).toContain('setPresentedEvidenceId(item.id)'); expect(game).toContain('?evidenceId='); expect(interrogation).toContain('presentedEvidenceIds: evidenceId ? [evidenceId] : []'); });
  it('uses the actual evidence-view response and guards optional arrays', () => { const source = read('app/game/[sessionId]/page.tsx'); expect(source).toContain('result?.newClues'); expect(source).toContain('Array.isArray(result?.newlyUnlockedEvidence)'); expect(source).not.toContain('result.newClueIds.length'); });
  it('keeps the note form stable and applies the returned row immediately', () => { const source = read('app/game/[sessionId]/records/page.tsx'); expect(source).toContain('const form = event.currentTarget'); expect(source).toContain('updateNoteState(saved)'); expect(source).toContain("saving ? '저장 중...'" ); expect(source.indexOf('updateNoteState(saved)')).toBeLessThan(source.indexOf('form.reset()')); });
  it('renders Korean labels without exposing raw fallback state codes', () => { const source = read('app/game/[sessionId]/interrogation/[suspectId]/page.tsx'); expect(source).toContain('message.emotionAfterLabel || emotionLabel(message.emotionAfter)'); expect(source).toContain('message.questionTypeLabel || questionTypeLabel(message.questionType)'); });
  it('does not expose API error details or codes in the shared error UI', () => { const source = read('components/ui/ApiState.tsx'); expect(source).not.toContain('{error.message}'); expect(source).not.toContain('{code}'); });
  it('uses the server unlock response and refreshes each interrogation cache once', () => { const source = read('app/game/[sessionId]/interrogation/[suspectId]/page.tsx'); expect(source).toContain('result.newlyUnlockedClues'); expect(source).toContain('result.newlyUnlockedEvidence'); expect(source.match(/clues\.reload\(\)/g)?.length).toBe(1); });
  it('shows clue names in unlock notices and opens a clue detail list', () => { const game = read('app/game/[sessionId]/page.tsx'); const interrogation = read('app/game/[sessionId]/interrogation/[suspectId]/page.tsx'); expect(game).toContain('새로운 단서를 획득했습니다. 단서:'); expect(game).toContain('<ClueModal'); expect(interrogation).toContain('목록 보기'); expect(interrogation).toContain('unlockedClues.map((clue) => clue.title)'); });
  it('submits deduction without a client-side correctness decision', () => { const source = read('app/game/[sessionId]/deduction/page.tsx'); expect(source).toContain('/deduction`'); expect(source).not.toContain('isCorrect'); });
  it('uses progress API values instead of hard-coded counters', () => { const source = read('app/regions/page.tsx'); expect(source).toContain('progress.data.solvedEpisodeCount'); expect(source).not.toContain('solvedCount={0}'); expect(source).not.toContain('cluesCollected={2}'); });
  it('contains no bundled culprit, truth, response-bank, or local session engine fields', () => { const all = sourceFiles(root).map((file) => readFileSync(file, 'utf8')).join('\n'); for (const forbidden of ['culpritId', 'trueEndingNarration', 'trueEndingArrestLine', 'falseEndings', 'responseBank', 'sessionStorage']) expect(all).not.toContain(forbidden); });
  it('never exposes a service role key to public frontend code', () => { const all = sourceFiles(root).map((file) => readFileSync(file, 'utf8')).join('\n'); expect(all).not.toContain('SUPABASE_SERVICE_ROLE_KEY'); });
});
