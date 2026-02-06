import { describe, expect, test } from 'vitest';
import { deepEqual } from 'blackswan-foundation';

describe('deepEqual', () => {
  test('handles primitives and identity', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual(1, 2)).toBe(false);
    const obj = { a: 1 };
    expect(deepEqual(obj, obj)).toBe(true);
  });

  test('handles arrays', () => {
    expect(deepEqual([1, 2], [1, 2])).toBe(true);
    expect(deepEqual([1, 2], [2, 1])).toBe(false);
    expect(deepEqual([1], [1, 2])).toBe(false);
  });

  test('ignores undefined properties', () => {
    expect(deepEqual({ a: 1, b: undefined }, { a: 1 })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(true);
  });

  test('handles nested objects', () => {
    expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
    expect(deepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
  });

  test('handles Date and RegExp', () => {
    expect(deepEqual(new Date(0), new Date(0))).toBe(true);
    expect(deepEqual(new Date(0), new Date(1))).toBe(false);
    expect(deepEqual(/abc/i, /abc/i)).toBe(true);
    expect(deepEqual(/abc/i, /abc/g)).toBe(false);
  });
});
