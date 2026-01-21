// possible upgrade
// https://github.com/PimpTrizkit/PJs/wiki/12.-Shade,-Blend-and-Convert-a-Web-Color-(pSBC.js)
// todo support alpha

export function rgbToHex(red: number, green: number, blue: number): string {
   
  const rgb = (red << 16) | (green << 8) | (blue << 0);
  return `#${(0x1000000 + rgb).toString(16).slice(1)}`;
}

export function hexToRgb(color: string): [number, number, number] {
  let hex = color;
  if (hex.indexOf('#') === 0) {
    hex = hex.slice(1);
  }

  // convert 3-digit hex to 6-digits.
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  if (hex.length !== 6) {
    throw new Error('Invalid HEX color.');
  }

  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

export function invertColor(color: string, bw: boolean = true): string {
  const [r, g, b] = hexToRgb(color);

  if (bw) {
    // https://stackoverflow.com/a/3943023/112731
    return (r * 0.299 + g * 0.587 + b * 0.114) > 136 // 186
      ? '#000000'
      : '#FFFFFF';
  }

  return rgbToHex(255 - r, 255 - g, 255 - b);
}

/**
 * Lightens or darkens a hex color
 * @param color Hex value format: #ffffff or ffffff
 * @param percent Decimal value where:
 * - values < 1 lighten the color (0.5 = 50% lighter)
 * - values > 1 darken the color (1.5 = 50% darker)
 * - value = 1 returns original color
 * @returns Hex color string with # prefix
 */
export function shadeColor(color: string, percent: number = 0.1): string {
  // Remove # if present
  const clearHex = color.replace('#', '');

  // Convert hex to RGB
  const r = parseInt(clearHex.substring(0, 2), 16);
  const g = parseInt(clearHex.substring(2, 4), 16);
  const b = parseInt(clearHex.substring(4, 6), 16);

  // Calculate new values
  const calculateShade = (value: number): number => {
    if (percent < 1) {
      return Math.min(255, Math.round(value + (255 - value) * (1 - percent)));
    }

    return Math.max(0, Math.round(value * (2 - percent)));
  };

  // Apply shading
  const newR = calculateShade(r);
  const newG = calculateShade(g);
  const newB = calculateShade(b);

  // Convert back to hex
  const toHex = (n: number): string => {
    const hex = n.toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}
