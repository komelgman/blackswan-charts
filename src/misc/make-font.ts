/**
 * Generates a font string, which can be used to set in canvas' font property.
 */

import type { TextStyle } from '@/model/chart/types/styles';

export default function makeFont(textOptions: TextStyle): string {
  const style = textOptions.fontStyle ? `${textOptions.fontStyle} ` : '';
  return `${style}${textOptions.fontSize}px ${textOptions.fontFamily}`;
}
