import type { Cloneable } from '@blackswan/foundation';
import type { PriceScalingFunction } from '@/model/chart/axis/scaling/PriceScalingFunction';
import type { Price } from '@/model/chart/types';

export default class PriceRegularScaling implements PriceScalingFunction, Cloneable<PriceScalingFunction> {
  public translate(worldCoordinate: Price): number {
    return worldCoordinate as number;
  }

  public revert(scaledCoordinate: number): Price {
    return (scaledCoordinate as any) as Price;
  }

  public clone(): PriceScalingFunction {
    return this; // stateless class so can be used by instance
  }
}
