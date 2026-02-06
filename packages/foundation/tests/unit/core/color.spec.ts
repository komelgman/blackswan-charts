import { describe, expect, test } from 'vitest';
import { rgbToHex, hexToRgb, invertColor, shadeColor } from 'blackswan-foundation';

describe('color utils', () => {
  test('rgbToHex and hexToRgb roundtrip', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
    expect(hexToRgb('#ff0000')).toStrictEqual([255, 0, 0]);
  });

  test('hexToRgb supports 3-digit hex', () => {
    expect(hexToRgb('#abc')).toStrictEqual([170, 187, 204]);
  });

  test('hexToRgb throws on invalid hex', () => {
    expect(() => hexToRgb('#abcd')).toThrow(/Invalid HEX color/);
  });

  test('invertColor', () => {
    expect(invertColor('#ffffff')).toBe('#000000');
    expect(invertColor('#000000')).toBe('#FFFFFF');
    expect(invertColor('#123456', false)).toBe('#edcba9');
  });

  test('shadeColor', () => {
    expect(shadeColor('#000000', 0.5)).toBe('#808080');
    expect(shadeColor('#ffffff', 1.5)).toBe('#808080');
    expect(shadeColor('#abcdef', 1)).toBe('#abcdef');
  });
});
