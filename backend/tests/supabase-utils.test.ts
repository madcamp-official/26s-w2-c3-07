import { describe, expect, it } from 'vitest';
import { assertOwnedBy, requireSingle, toAppError } from '../src/shared/utils/supabase.js';

describe('Supabase helpers', () => {
  it('maps unique violations to conflicts', () => expect(toAppError({ code: '23505', message: 'duplicate' }).statusCode).toBe(409));
  it('returns a single row', () => expect(requireSingle({ id: '1' }, null)).toEqual({ id: '1' }));
  it('rejects a missing row', () => expect(() => requireSingle(null, null)).toThrow(/not found/i));
  it('accepts ownership', () => expect(() => assertOwnedBy('user-1', 'user-1')).not.toThrow());
  it('rejects cross-user access', () => expect(() => assertOwnedBy('user-1', 'user-2')).toThrow(/does not belong/));
});
