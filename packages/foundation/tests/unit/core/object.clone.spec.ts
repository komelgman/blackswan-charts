/* eslint-disable no-sparse-arrays */
import { expect, test } from 'vitest';
import { clone } from '@blackswan/foundation';

test.each([
  { a: [], ex: [] },
  { a: new Array(3), ex: new Array(3) },
  { a: [null], ex: [null] },
  { a: [undefined], ex: [undefined] },
  { a: [, 1, null, undefined], ex: [, 1, null, undefined] },
  { a: {}, ex: {} },
  {
    a: { p1: 1, p2: null, p3: undefined, p4: { p5: [1, 2, 3, , , 6] } },
    ex: { p1: 1, p2: null, p3: undefined, p4: { p5: [1, 2, 3, , , 6] } },
  },
])('clone($a) -> $ex', ({ a, ex }) => {
  const cloned: any = clone(a);

  expect(Object.is(a, cloned)).toBeFalsy();
  expect(cloned).toStrictEqual(ex);
});
