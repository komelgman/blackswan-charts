import { expect, test } from 'vitest';
import {
  isEmpty,
  isNumber,
  isInteger,
  isString,
  isBoolean,
  notNull,
  undefinedIfNull,
} from '@blackswan/foundation';

test('isEmpty', () => {
  expect(isEmpty(undefined)).toBe(true);
  expect(isEmpty({})).toBe(true);
  expect(isEmpty({ a: {} })).toBe(true);
  expect(isEmpty({ a: [] })).toBe(false);
  expect(isEmpty({ a: 1 })).toBe(false);
  expect(isEmpty({ a: { b: 1 } })).toBe(false);
});

test('type guards and helpers', () => {
  expect(isNumber(1)).toBe(true);
  expect(isNumber(NaN)).toBe(false);
  expect(isInteger(1)).toBe(true);
  expect(isInteger(1.2)).toBe(false);
  expect(isString('a')).toBe(true);
  expect(isString(1)).toBe(false);
  expect(isBoolean(true)).toBe(true);
  expect(isBoolean('true')).toBe(false);
  expect(notNull(0)).toBe(true);
  expect(notNull(null)).toBe(false);
  expect(undefinedIfNull(null)).toBeUndefined();
  expect(undefinedIfNull(1)).toBe(1);
});
