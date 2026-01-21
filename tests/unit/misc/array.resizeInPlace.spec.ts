 
import { expect, test } from 'vitest';
import { resizeInPlace } from '@/model/misc/array.resizeInPlace';

test.each([
  { a: [], s: 0, ex: [] },
  { a: [1], s: 2, ex: [1, undefined] },
  { a: [1, 2, 3], s: 2, ex: [1, 2] },
  { a: [1, 2, 3], s: 0, ex: [] },
])('resizeInPlace($a, $s) -> $ex', ({ a, s, ex }) => {
  resizeInPlace(a, s);

  expect(a.length).toEqual(s);
  expect(ex).toStrictEqual(a);
});
