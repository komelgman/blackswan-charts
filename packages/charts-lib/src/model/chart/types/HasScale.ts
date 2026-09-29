import type PriceAxisScale from '@/model/chart/axis/scaling/PriceAxisScale';

/** Stable reference stored in JSON; executable definitions live in the chart registry. */
export type PriceScaleReference = Pick<PriceAxisScale, 'id'>;

/** Shared by any drawing whose geometry uses one price interpolation scale. */
export interface HasScale<Scale extends PriceScaleReference = PriceAxisScale> {
  scale: Scale;
}

/** Recognizes both live and serialized references without assuming executable functions survived JSON. */
export function hasScale(data: unknown): data is HasScale<PriceScaleReference> {
  if (data === null || typeof data !== 'object' || !('scale' in data)) return false;
  const scale = data.scale;
  return scale !== null && typeof scale === 'object' && 'id' in scale && typeof scale.id === 'string';
}
