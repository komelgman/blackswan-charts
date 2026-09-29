import type { DeepPartial } from '@blackswan/foundation';
import type { DrawingProjection } from '@/model/chart/drawing/DrawingProjection';
import type { HandleId } from '@/model/datasource/types';

/** Screen delta uses previous-minus-current coordinates, as does the viewport. */
export interface DrawingDrag {
  readonly x: number;
  readonly y: number;
  readonly dx: number;
  readonly dy: number;
}

/** Computes a data patch. The caller owns mutations and transaction lifetime. */
export type DrawingBehavior<T = any> = (
  data: Readonly<T>,
  projection: DrawingProjection,
  drag: DrawingDrag,
  handle?: HandleId,
) => DeepPartial<T> | undefined;
