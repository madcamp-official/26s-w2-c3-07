import { createHash, randomUUID } from 'node:crypto';
import { buildReportPrompt } from '../../llm/prompts/report.prompt.js';
import { AppError } from '../../shared/errors/app-error.js';
import { endingLlm } from './ending.llm.js';
import { endingRepository as repository } from './ending.repository.js';
import type { EndingDto, StoredReport } from './ending.types.js';

function mapReportError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('ENDING_SESSION_NOT_FOUND')) throw new AppError(404, 'Session not found', 'SESSION_NOT_FOUND');
  if (message.includes('ENDING_SESSION_NOT_COMPLETED')) throw new AppError(409, 'Session is not completed', 'ENDING_NOT_AVAILABLE');
  if (message.includes('ENDING_RESULT_NOT_FOUND')) throw new AppError(404, 'Game result not found', 'ENDING_RESULT_NOT_FOUND');
  if (message.includes('ENDING_REPORT_IN_PROGRESS')) throw new AppError(409, 'Report generation is in progress', 'ENDING_REPORT_IN_PROGRESS');
  if (message.includes('ENDING_REPORT_RATE_LIMITED')) throw new AppError(429, 'Report generation is rate limited', 'ENDING_REPORT_RATE_LIMITED');
  if (message.includes('ENDING_REPORT_ATTEMPTS_EXHAUSTED')) throw new AppError(429, 'Report generation attempts exhausted', 'ENDING_REPORT_ATTEMPTS_EXHAUSTED');
  throw error;
}

async function fixedEnding(sessionId: string, userId: string): Promise<EndingDto> {
  const session = await repository.findOwnedSession(sessionId, userId);
  if (!session) throw new AppError(404, 'Session not found', 'SESSION_NOT_FOUND');
  if (session.status !== 'COMPLETED') throw new AppError(409, 'Session is not completed', 'ENDING_NOT_AVAILABLE');
  const result = await repository.findResult(session.id);
  if (!result) throw new AppError(404, 'Game result not found', 'ENDING_RESULT_NOT_FOUND');
  const ending = await repository.loadEnding(session, result);
  if (!ending) throw new AppError(500, 'Ending content is incomplete', 'ENDING_CONTENT_INVALID');
  return ending;
}

function withReport(ending: EndingDto, report: StoredReport): EndingDto {
  return { ...ending, reportText: report.reportText, aftermathText: report.aftermathText, reportGeneratedAt: report.generatedAt };
}

function reportPreservesJudgment(ending: EndingDto, reportText: string, aftermathText: string): boolean {
  const combined = `${reportText}\n${aftermathText}`;
  if (!combined.includes(ending.actualCulprit.name)) return false;
  if (ending.endingType !== 'TRUE') {
    const escaped = ending.selectedSuspect.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`${escaped}.{0,8}(?:이|가)?\\s*범인`).test(combined)) return false;
  }
  return true;
}

async function safeLog(input: Parameters<typeof repository.logReport>[0]): Promise<void> {
  await repository.logReport(input).catch(() => undefined);
}

export const endingService = {
  ending: fixedEnding,

  async report(sessionId: string, userId: string): Promise<EndingDto> {
    const ending = await fixedEnding(sessionId, userId);
    if (ending.reportText && ending.aftermathText && ending.reportGeneratedAt) return ending;

    let claim;
    try { claim = await repository.claimReport(sessionId, userId); }
    catch (error) { return mapReportError(error); }
    if (claim.action === 'REUSE' && claim.reportText && claim.aftermathText && claim.generatedAt) {
      return withReport(ending, { reportText: claim.reportText, aftermathText: claim.aftermathText, generatedAt: claim.generatedAt });
    }

    const prompt = buildReportPrompt(ending);
    const promptHash = createHash('sha256').update(prompt).digest('hex');
    const requestId = randomUUID();
    const startedAt = Date.now();
    try {
      const generated = await endingLlm.generate(prompt);
      if (!reportPreservesJudgment(ending, generated.output.reportText, generated.output.aftermathText)) throw new Error('ENDING_REPORT_JUDGMENT_CHANGED');
      const stored = await repository.completeReport(sessionId, userId, generated.output.reportText, generated.output.aftermathText);
      await safeLog({ sessionId, userId, requestId, model: generated.model, promptHash, inputTokens: generated.inputTokens, outputTokens: generated.outputTokens, latencyMs: generated.latencyMs, status: 'COMPLETED', errorCode: null });
      return withReport(ending, stored);
    } catch {
      await repository.failReport(sessionId, userId).catch(() => undefined);
      await safeLog({ sessionId, userId, requestId, model: 'gpt-4o-mini', promptHash, inputTokens: null, outputTokens: null, latencyMs: Date.now() - startedAt, status: 'FAILED', errorCode: 'ENDING_REPORT_FAILED' });
      return ending;
    }
  }
};
