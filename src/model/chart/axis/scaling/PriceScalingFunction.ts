import type ScalingFunction from '@/model/chart/axis/scaling/ScalingFunction';
import type { Price, Range } from '@/model/chart/types';

export interface AxisScale<T extends number> extends ScalingFunction<T> {
  getTicks(range: Range<T>, targetPx: number, screenSize: number): T[];
  formatTick(value: T, fraction: number): string;
  niceDomain?(range: Range<T>): Range<T>;
  snapToStep?(value: T): T;
}

export type PriceScalingFunction = AxisScale<Price>;
