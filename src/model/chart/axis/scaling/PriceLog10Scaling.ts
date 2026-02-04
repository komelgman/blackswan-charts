import math from '@/model/misc/math';
import type { Cloneable } from '@/model/misc/object.clone';
import type { PriceScalingFunction } from '@/model/chart/axis/scaling/PriceScalingFunction';
import type { Price, Range } from '@/model/chart/types';

export default class PriceLog10Scaling implements PriceScalingFunction, Cloneable<PriceScalingFunction> {
  public translate(worldCoordinate: Price): number {
    return math.log10(worldCoordinate);
  }

  public revert(virtualCoordinate: number): Price {
    return math.exp10(virtualCoordinate) as Price;
  }

  public getTicks(range: Range<Price>, targetPx: number, screenSize: number): Price[] {
    const from = range.from as number;
    const to = range.to as number;
    if (!Number.isFinite(from) || !Number.isFinite(to)) {
      return [];
    }

    const min = Math.min(from, to);
    const max = Math.max(from, to);
    if (max <= 0) {
      return [];
    }

    const safeMin = min > 0 ? min : Number.MIN_VALUE;
    const minExp = Math.floor(Math.log10(safeMin));
    const maxExp = Math.ceil(Math.log10(max));
    const desiredCount = Math.max(2, Math.floor(screenSize / targetPx));
    const decades = maxExp - minExp + 1;
    let multipliers = [1, 2, 5];

    if (desiredCount <= decades) {
      multipliers = [1];
    } else if (desiredCount <= decades * 2) {
      multipliers = [1, 5];
    }

    const ticks: Price[] = [];
    for (let exp = minExp; exp <= maxExp; exp += 1) {
      const base = 10 ** exp;
      for (const multiplier of multipliers) {
        const value = multiplier * base;
        if (value >= min && value <= max) {
          ticks.push(value as Price);
        }
      }
    }

    if (ticks.length > desiredCount) {
      const stride = Math.ceil(ticks.length / desiredCount);
      return ticks.filter((_, index) => index % stride === 0);
    }

    return ticks;
  }

  public formatTick(value: Price, fraction: number): string {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: Math.max(fraction, 0),
    });
  }

  public clone(): PriceScalingFunction {
    return this; // stateless class so can be used by instance
  }
}
