 
import { expect, test } from 'vitest';
import { filterInPlace } from '@blackswan/foundation';

test.each([
  { a: [1, 2, 3, 4, 5], p: () => true, ex: [1, 2, 3, 4, 5] },
  { a: [1, 2, 3, 4, 5], p: (v: number) => v !== 4, ex: [1, 2, 3, 5] },
  { a: [1, 2, 3, 4, 5], p: (v: number) => v > 4, ex: [5] },
])('filterInPlace($a, $p) -> $ex', ({ a, p, ex }) => {
  filterInPlace(a, p);

  expect(ex).toStrictEqual(a);
});
