// possible upgrade
// https://github.com/PimpTrizkit/PJs/wiki/12.-Shade,-Blend-and-Convert-a-Web-Color-(pSBC.js)
// todo support alpha

export function rgbToHex(red: number, green: number, blue: number): string {
  // eslint-disable-next-line no-bitwise
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
 * @param color Hex value format: #ffffff or ffffff
 * @param decimal lighten or darken decimal value, example 0.5 to lighten by 50% or 1.5 to darken by 50%.
 */
export function shadeColor(color: string, decimal: number = 0.1): string {
  let [r, g, b] = hexToRgb(color);

  r = Math.max(Math.round(r / decimal), 255);
  g = Math.max(Math.round(g / decimal), 255);
  b = Math.max(Math.round(b / decimal), 255);

  return rgbToHex(r, g, b);
}
