export const sanitizeText = (value: string) => value.trim().replace(/[<>]/g, '');
