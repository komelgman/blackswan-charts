import type { Cloneable } from '@/model/misc/object.clone';
import type { PriceScalingFunction } from '@/model/chart/axis/scaling/PriceScalingFunction';
import type { Price, Range } from '@/model/chart/types';

export default class PriceRegularScaling implements PriceScalingFunction, Cloneable<PriceScalingFunction> {
  public translate(worldCoordinate: Price): number {
    return worldCoordinate as number;
  }

  public revert(scaledCoordinate: number): Price {
    return (scaledCoordinate as any) as Price;
  }

  public getTicks(range: Range<Price>, targetPx: number, screenSize: number): Price[] {
    const from = range.from as number;
    const to = range.to as number;
    if (!Number.isFinite(from) || !Number.isFinite(to)) {
      return [];
    }

    const min = Math.min(from, to);
    const max = Math.max(from, to);
    if (min === max) {
      return [min as Price];
    }

    const desiredCount = Math.max(2, Math.floor(screenSize / targetPx));
    const span = max - min;
    const rawStep = span / (desiredCount - 1);
    const step = this.niceStep(rawStep);
    if (step === 0) {
      return [min as Price];
    }

    const first = Math.floor(min / step) * step;
    const last = Math.ceil(max / step) * step;
    const ticks: Price[] = [];

    for (let value = first; value <= last + step * 0.5; value += step) {
      ticks.push(value as Price);
    }

    return ticks;
  }

  public formatTick(value: Price, fraction: number): string {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: fraction,
      maximumFractionDigits: fraction,
    });
  }

  public clone(): PriceScalingFunction {
    return this; // stateless class so can be used by instance
  }

  private niceStep(step: number): number {
    if (!Number.isFinite(step) || step <= 0) {
      return 0;
    }

    const exponent = Math.floor(Math.log10(step));
    const magnitude = 10 ** exponent;
    const fraction = step / magnitude;
    let niceFraction = 1;

    if (fraction <= 1) {
      niceFraction = 1;
    } else if (fraction <= 2) {
      niceFraction = 2;
    } else if (fraction <= 5) {
      niceFraction = 5;
    } else {
      niceFraction = 10;
    }

    return niceFraction * magnitude;
  }
}
