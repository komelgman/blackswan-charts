import type { Range } from '@/model/chart/types';

export function inRange<T>(p: T, range: Range<T>): boolean {
  return p >= range.from && p <= range.to;
}
