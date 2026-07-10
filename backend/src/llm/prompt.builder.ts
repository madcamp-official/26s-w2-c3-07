export const buildPrompt = (parts: string[]) => parts.filter(Boolean).join('\n\n');
