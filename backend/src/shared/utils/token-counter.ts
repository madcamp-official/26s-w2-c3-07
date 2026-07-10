export const countTokens = (text: string) =>
  Math.ceil(text.trim().split(/\s+/).filter(Boolean).length * 1.3);
