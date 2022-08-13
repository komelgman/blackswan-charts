import { Price } from '@/model/type-defs';
import { PriceScalingFunction } from '@/model/axis/scaling/PriceScalingFunction';
import { Cloneable } from '@/misc/strict-type-checks';
import math from '@/misc/math';

export default class PriceLog10Scaling implements PriceScalingFunction, Cloneable<PriceScalingFunction> {
  public translate(worldCoordinate: Price): number {
    return math.log10(worldCoordinate);
  }

  public revert(virtualCoordinate: number): Price {
    return math.exp10(virtualCoordinate) as Price;
  }

  public translateInRawArray(worldData: never[][], translatedDataIndexes: number[]): void {
    // for (let i = 0; i < worldData.length; i += 1) {
    //  (worldCoordinates[i][index] as any) as Price
    // }
  }

  public clone(): PriceScalingFunction {
    return this; // stateless class so can be used by instance
  }
}
