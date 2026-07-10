export const parseJsonResponse = <T>(text: string): T => JSON.parse(text) as T;
