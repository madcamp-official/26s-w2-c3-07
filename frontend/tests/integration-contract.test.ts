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
  it('submits deduction without a client-side correctness decision', () => { const source = read('app/game/[sessionId]/deduction/page.tsx'); expect(source).toContain('/deduction`'); expect(source).not.toContain('isCorrect'); });
  it('uses progress API values instead of hard-coded counters', () => { const source = read('app/regions/page.tsx'); expect(source).toContain('progress.data.solvedEpisodeCount'); expect(source).not.toContain('solvedCount={0}'); expect(source).not.toContain('cluesCollected={2}'); });
  it('contains no bundled culprit, truth, response-bank, or local session engine fields', () => { const all = sourceFiles(root).map((file) => readFileSync(file, 'utf8')).join('\n'); for (const forbidden of ['culpritId', 'trueEndingNarration', 'trueEndingArrestLine', 'falseEndings', 'responseBank', 'sessionStorage']) expect(all).not.toContain(forbidden); });
  it('never exposes a service role key to public frontend code', () => { const all = sourceFiles(root).map((file) => readFileSync(file, 'utf8')).join('\n'); expect(all).not.toContain('SUPABASE_SERVICE_ROLE_KEY'); });
});
