/* eslint-disable no-sparse-arrays */
import { describe, expect, it, test } from 'vitest';
import { merge } from '@/model/misc/object.merge';

describe('merge tuples', () => {
  it('should throw error', () => {
    expect(() => merge([1], [])).toThrowError(/can merge tuples with same length only/);
    expect(() => merge([], [1], [])).toThrowError(/can merge tuples with same length only/);
    expect(() => merge([, 2, 2], [, 1], [])).toThrowError(/can merge tuples with same length only/);
  });

  test.each([
    { a: [], b: [], ex: [[], {}] },
    { a: [1], b: { 0: undefined }, ex: [[undefined], { 0: 1 }] },
    { a: [1], b: { 0: null }, ex: [new Array(1), { 0: 1 }] },
    { a: [1], b: [null], ex: [[null], { 0: 1 }] },
    { a: [1], b: [undefined], ex: [[undefined], { 0: 1 }] },
    { a: [1], b: [1], ex: [[1], {}] },
    { a: [1], b: ['1'], ex: [['1'], { 0: 1 }] },
    { a: ['1'], b: [1], ex: [[1], { 0: '1' }] },
    { a: [1], b: [2], ex: [[2], { 0: 1 }] },
    { a: [1, 2], b: [, 3], ex: [[1, 3], { 1: 2 }] },
  ])('merge($a, $b) -> $ex', ({ a, b, ex }) => {
    const temp = JSON.stringify(a);
    const mergeResult = merge(a, b);
    expect(mergeResult).toStrictEqual(ex);

    const [unmerge] = merge(ex[0], ex[1]);
    expect(unmerge).toStrictEqual(JSON.parse(temp));
  });

  test.each([
    { a: [, 2], b: [, 3], ex: [[, 3], { 1: 2 }] },
    { a: [, 2], b: [1, 3], ex: [[1, 3], { 0: null, 1: 2 }] },
    { a: [1, 3], b: { 0: null, 1: 2 }, ex: [[, 2], { 0: 1, 1: 3 }] },
  ])('merge($a, $b) -> $ex', ({ a, b, ex }) => {
    expect(merge(a, b)).toStrictEqual(ex);
  });
});

describe('merge objects', () => {
  test.each([
    { a: {}, b: {}, ex: [{}, {}] },
    { a: { p1: undefined }, b: {}, ex: [{ p1: undefined }, {}] },
    { a: { p1: null }, b: {}, ex: [{ p1: null }, {}] },
    { a: {}, b: { p1: undefined }, ex: [{ p1: undefined }, { p1: null }] },
    { a: {}, b: { p1: null }, ex: [{}, {}] },
    { a: { p1: null }, b: { p1: null }, ex: [{ p1: null }, {}] },
    { a: { p1: null }, b: { p1: 1 }, ex: [{ p1: 1 }, { p1: null }] }, // warn can't be reverted to the same
    { a: { p1: 1 }, b: { p1: null }, ex: [{}, { p1: 1 }] },
    { a: {}, b: { p1: { p11: 1 } }, ex: [{ p1: { p11: 1 } }, { p1: null }] },
    {
      a: { p1: undefined },
      b: { p1: { p11: 1 } },
      ex: [
        { p1: { p11: 1 } },
        { p1: undefined },
      ],
    },
    {
      a: { p1: null },
      b: { p1: { p11: 1 } },
      ex: [
        { p1: { p11: 1 } },
        { p1: null },
      ],
    },
    {
      a: { p1: { p11: '1', p12: null, p13: undefined, p14: 1.3, p15: {}, p16: [1, 2, 3] } },
      b: { p1: { p11: 1 } },
      ex: [
        { p1: { p11: 1, p12: null, p13: undefined, p14: 1.3, p15: {}, p16: [1, 2, 3] } },
        { p1: { p11: '1' } },
      ],
    },
    {
      a: { p1: { p11: '1', p12: null, p13: undefined, p14: 1.3, p15: {}, p16: [1, 2, 3] } },
      b: { p1: { p11: 1, p12: 2, p13: 3, p14: 4.4, p15: undefined, p16: [2, 1, 0] } },
      ex: [
        { p1: { p11: 1, p12: 2, p13: 3, p14: 4.4, p15: undefined, p16: [2, 1, 0] } },
        { p1: { p11: '1', p12: null, p13: undefined, p14: 1.3, p15: {}, p16: [1, 2, 3] } },
      ],
    },
    {
      a: { p1: { abc: { a: null } } },
      b: { p1: { p11: 1 } },
      ex: [
        { p1: { abc: { a: null }, p11: 1 } },
        { p1: { p11: null } },
      ],
    },
    {
      a: { p1: { abc: { a: null } } },
      b: { p1: { abc: { a: null } } },
      ex: [
        { p1: { abc: { a: null } } },
        { },
      ],
    },

  ])('merge($a, $b) -> $ex', ({ a, b, ex }) => {
    expect(merge(a, b)).toStrictEqual(ex);
  });

  test('merge 3 objects', () => {
    expect(merge({}, { p1: 1 }, { p1: 2 })).toStrictEqual([{ p1: 2 }, { p1: null }]);
    expect(merge({}, { p1: { p2: 1 } }, { p1: { p2: 2 } })).toStrictEqual([{ p1: { p2: 2 } }, { p1: null }]);
    expect(merge({ p1: 0 }, { p1: 1 }, { p1: 2, p2: 1 })).toStrictEqual([{ p1: 2, p2: 1 }, { p1: 0, p2: null }]);
  });
});
