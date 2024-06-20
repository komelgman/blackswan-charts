import { isString } from '@/misc/strict-type-checks';
import type { DataSourceId } from '@/model/datasource/DataSource';
import type { EntityId } from '@/model/tools/IdBuilder';
import type { Point } from '@/model/type-defs';
import type HasCenterPos from '@/model/type-defs/options/HasCenterPos';
import type HasCursor from '@/model/type-defs/options/HasCursor';

export declare type DrawingId = EntityId;
export declare type ExternalDrawingId = [DataSourceId, DrawingId];
export declare type DrawingReference = DrawingId | ExternalDrawingId;
export declare type DrawingType = string;
export declare type HandleId = string;

export function isEqualDrawingReference(ref1: DrawingReference, ref2: DrawingReference): boolean {
  if (isString(ref1)) {
    return isString(ref2) && ref1 === ref2;
  }

  return !isString(ref2) && ref1[0] === ref2[0] && ref1[1] === ref2[1];
}

export interface DrawingOptions<DataType = any> {
  id: DrawingId; // todo: think about remove from options
  type: DrawingType;
  data: DataType;
  locked: boolean;
  visible: boolean;
  title?: string;
  shareWith?: '*' | DataSourceId[];
}

export interface DrawingDescriptor<DataType = any> {
  ref: DrawingReference;
  options: Omit<DrawingOptions<DataType>, 'id'>;
  valid?: boolean;
  visibleInViewport?: boolean;
}

export interface Graphics {
  type?: string;
  render(ctx: CanvasRenderingContext2D): void;

  hitTest(ctx: CanvasRenderingContext2D, screenPos: Point): boolean;
}

export interface DrawingHandle extends Graphics, HasCursor, HasCenterPos {
}

export interface AxisMark {
  text: string;
  screenPos: number;
  textColor: string;
}

export default interface Drawing {
  parts: Graphics[];
  handles: Record<HandleId, DrawingHandle>;
}
