import math from '@/model/misc/math';
import type { Cloneable } from 'blackswan-foundation';
import type { PriceScalingFunction } from '@/model/chart/axis/scaling/PriceScalingFunction';
import type { Price } from '@/model/chart/types';

export default class PriceLog10Scaling implements PriceScalingFunction, Cloneable<PriceScalingFunction> {
  public translate(worldCoordinate: Price): number {
    return math.log10(worldCoordinate);
  }

  public revert(virtualCoordinate: number): Price {
    return math.exp10(virtualCoordinate) as Price;
  }

  public clone(): PriceScalingFunction {
    return this; // stateless class so can be used by instance
  }
}
