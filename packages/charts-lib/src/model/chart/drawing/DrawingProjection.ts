import type { LogicSize, Price, Range, UTCTimestamp } from '@/model/chart/types';
import type { ControlMode } from '@/model/chart/axis/types';
import type PriceAxisScale from '@/model/chart/axis/scaling/PriceAxisScale';

/** Read-only coordinates and display policy, with no access to sources or history. */
export interface AxisProjection<T extends number> {
  readonly range: Readonly<Range<T>>;
  readonly screenSize: Readonly<LogicSize>;
  readonly controlMode: { readonly value: ControlMode };
  translate(value: T): number;
  revert(position: number): T;
  translateBatchInPlace(values: (number | undefined)[][], indices: number[]): void;
}
export interface DrawingProjection {
  readonly timeAxis: AxisProjection<UTCTimestamp> & { isJustFollow(): boolean };
  readonly priceAxis: AxisProjection<Price> & {
    readonly scale: PriceAxisScale;
    readonly inverted: { readonly value: number };
    formatPrice(value: Price): string;
    applyPaddingToRange(range: Range<Price>, low: number, high: number): Range<Price>;
  };
}

/** Created once per viewport; getters observe the current axes during pan/zoom. */
export function createDrawingProjection(source: DrawingProjection): DrawingProjection {
  return {
    timeAxis: {
      get range() {
        return source.timeAxis.range;
      },
      get screenSize() {
        return source.timeAxis.screenSize;
      },
      get controlMode() {
        return source.timeAxis.controlMode;
      },
      translate: (value) => source.timeAxis.translate(value),
      revert: (position) => source.timeAxis.revert(position),
      translateBatchInPlace: (values, indices) => source.timeAxis.translateBatchInPlace(values, indices),
      isJustFollow: () => source.timeAxis.isJustFollow(),
    },
    priceAxis: {
      get range() {
        return source.priceAxis.range;
      },
      get screenSize() {
        return source.priceAxis.screenSize;
      },
      get controlMode() {
        return source.priceAxis.controlMode;
      },
      get scale() {
        return source.priceAxis.scale;
      },
      get inverted() {
        return source.priceAxis.inverted;
      },
      translate: (value) => source.priceAxis.translate(value),
      revert: (position) => source.priceAxis.revert(position),
      translateBatchInPlace: (values, indices) => source.priceAxis.translateBatchInPlace(values, indices),
      formatPrice: (value) => source.priceAxis.formatPrice(value),
      applyPaddingToRange: (range, low, high) => source.priceAxis.applyPaddingToRange(range, low, high),
    },
  };
}
