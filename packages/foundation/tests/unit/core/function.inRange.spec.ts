import { expect, test } from 'vitest';
import { inRange } from 'blackswan-foundation';

test('inRange is inclusive', () => {
  expect(inRange(5, { from: 5, to: 10 })).toBe(true);
  expect(inRange(10, { from: 5, to: 10 })).toBe(true);
  expect(inRange(4, { from: 5, to: 10 })).toBe(false);
  expect(inRange(11, { from: 5, to: 10 })).toBe(false);
});
