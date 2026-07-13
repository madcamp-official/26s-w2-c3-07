import { describe, expect, it } from 'vitest';
import { parseEnv } from '../src/config/env.js';

const valid = { PORT: '4000', CORS_ORIGIN: 'http://localhost:3000', OPENAI_API_KEY: 'openai', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service' };

describe('parseEnv', () => {
  it('parses a complete environment', () => expect(parseEnv(valid)).toMatchObject({ PORT: 4000 }));
  it('fails clearly when required variables are missing', () => expect(() => parseEnv({})).toThrow(/Invalid environment variables/));
});
