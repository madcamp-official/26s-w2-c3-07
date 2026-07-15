const ENDING_IMAGE: Record<string, string> = {
  'GS-01-S1-TRUE': '/images/endings/GS/gs-ending-true-lee-sunim.png',
  'GS-01-S2-WRONG': '/images/endings/GS/gs-ending-wrong-kim-dohyeon.png',
  'GS-01-S3-WRONG': '/images/endings/GS/gs-ending-wrong-park-malsun.png',
  'GS-01-S4-WRONG': '/images/endings/GS/gs-ending-wrong-kim-panseok.png',

  'JL-01-S1-TRUE': '/images/endings/JL/jl-ending-true-jeong-chunsam.png',
  'JL-01-S2-WRONG': '/images/endings/JL/jl-ending-wrong-choi-malja.png',
  'JL-01-S3-WRONG': '/images/endings/JL/jl-ending-wrong-seo-jiyoung.png',
  'JL-01-S4-WRONG': '/images/endings/JL/jl-ending-wrong-oh-gapsu.png',

  'CC-01-S1-WRONG': '/images/endings/CC/cc-ending-wrong-no-bangseok.png',
  'CC-01-S2-TRUE': '/images/endings/CC/cc-ending-true-maeng-yongsik.png',
  'CC-01-S3-WRONG': '/images/endings/CC/cc-ending-wrong-mok-seonggu.png',
  'CC-01-S4-WRONG': '/images/endings/CC/cc-ending-wrong-pyo-seongdu.png',

  'JJ-01-S1-WRONG': '/images/endings/JJ/jj-ending-wrong-moon-taeo.png',
  'JJ-01-S2-TRUE': '/images/endings/JJ/jj-ending-true-kang-yunho.png',
  'JJ-01-S3-WRONG': '/images/endings/JJ/jj-ending-wrong-yang-jaewoo.png',
  'JJ-01-S4-WRONG': '/images/endings/JJ/jj-ending-wrong-oh-minseok.png',
};

export function resolveEndingImage(suspectCode: string, isCorrect: boolean): string | null {
  const key = `${suspectCode}-${isCorrect ? 'TRUE' : 'WRONG'}`;
  return ENDING_IMAGE[key] ?? null;
}
