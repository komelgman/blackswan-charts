import type { Cloneable } from '@/misc/object.clone';
import type { PriceScalingFunction } from '@/model/chart/axis/scaling/PriceScalingFunction';
import type { Price } from '@/model/chart/types';

export default class PriceRegularScaling implements PriceScalingFunction, Cloneable<PriceScalingFunction> {
  public translate(worldCoordinate: Price): number {
    return worldCoordinate as number;
  }

  public revert(scaledCoordinate: number): Price {
    return (scaledCoordinate as any) as Price;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public translateInRawArray(worldData: never[][], translatedDataIndexes: number[]): void {
    // for (let i = 0; i < worldData.length; i += 1) {
    //  (worldCoordinates[i][index] as any) as Price
    // }
  }

  public clone(): PriceScalingFunction {
    return this; // stateless class so can be used by instance
  }
}
