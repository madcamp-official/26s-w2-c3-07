import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveEndingImage } from '../src/features/episode/utils/endingImage';

const cases = [
  ['GS-01-S1', true, '/images/endings/GS/gs-ending-true-lee-sunim.png'],
  ['GS-01-S2', false, '/images/endings/GS/gs-ending-wrong-kim-dohyeon.png'],
  ['GS-01-S3', false, '/images/endings/GS/gs-ending-wrong-park-malsun.png'],
  ['GS-01-S4', false, '/images/endings/GS/gs-ending-wrong-kim-panseok.png'],
  ['JL-01-S1', true, '/images/endings/JL/jl-ending-true-jeong-chunsam.png'],
  ['JL-01-S2', false, '/images/endings/JL/jl-ending-wrong-choi-malja.png'],
  ['JL-01-S3', false, '/images/endings/JL/jl-ending-wrong-seo-jiyoung.png'],
  ['JL-01-S4', false, '/images/endings/JL/jl-ending-wrong-oh-gapsu.png'],
  ['CC-01-S1', false, '/images/endings/CC/cc-ending-wrong-no-bangseok.png'],
  ['CC-01-S2', true, '/images/endings/CC/cc-ending-true-maeng-yongsik.png'],
  ['CC-01-S3', false, '/images/endings/CC/cc-ending-wrong-mok-seonggu.png'],
  ['CC-01-S4', false, '/images/endings/CC/cc-ending-wrong-pyo-seongdu.png'],
  ['JJ-01-S1', false, '/images/endings/JJ/jj-ending-wrong-moon-taeo.png'],
  ['JJ-01-S2', true, '/images/endings/JJ/jj-ending-true-kang-yunho.png'],
  ['JJ-01-S3', false, '/images/endings/JJ/jj-ending-wrong-yang-jaewoo.png'],
  ['JJ-01-S4', false, '/images/endings/JJ/jj-ending-wrong-oh-minseok.png'],
] as const;

describe('ending image mapping', () => {
  it.each(cases)('maps %s (%s) to an existing asset', (suspectCode, isCorrect, expected) => {
    expect(resolveEndingImage(suspectCode, isCorrect)).toBe(expected);
    expect(existsSync(resolve(import.meta.dirname, '../public', expected.slice(1)))).toBe(true);
  });

  it('falls back safely for unknown or inconsistent result identifiers', () => {
    expect(resolveEndingImage('UNKNOWN', false)).toBeNull();
    expect(resolveEndingImage('GS-01-S1', false)).toBeNull();
  });
});
