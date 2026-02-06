import type { Range } from '../types/geometry';

export function inRange<T>(p: T, range: Range<T>): boolean {
  return p >= range.from && p <= range.to;
}
