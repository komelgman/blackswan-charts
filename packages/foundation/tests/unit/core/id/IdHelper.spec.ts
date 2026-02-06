import { expect, test } from 'vitest';
import { IdHelper } from '@blackswan/foundation';

test('IdHelper provides independent builders per group', () => {
  const helper = new IdHelper();
  const a = helper.forGroup('A');
  const b = helper.forGroup('B');

  expect(a.getNewId('x')).toBe('x0');
  expect(b.getNewId('x')).toBe('x0');
  expect(a.getNewId('x')).toBe('x1');
});
