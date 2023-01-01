import type { InvertedValue } from '@/model/axis/PriceAxis';
import type { DataSourceId } from '@/model/datasource/DataSource';
import type HasCenterPos from '@/model/options/HasCenterPos';
import type HasCursor from '@/model/options/HasCursor';
import type { EntityId } from '@/model/tools/IdBuilder';
import type { Point } from '@/model/type-defs';

export declare type DrawingId = EntityId;
export declare type ExternalDrawingId = [DataSourceId, DrawingId];
export declare type DrawingReference = DrawingId | ExternalDrawingId;
export declare type DrawingType = string;
export declare type HandleId = string;

export interface DrawingOptions<DataType = any> {
  id: DrawingId; // todo: think about remove
  type: DrawingType;
  data: DataType;
  locked: boolean;
  visible: boolean;
  title?: string;
  shareWith?: '*' | DataSourceId[];
}

export interface DrawingDescriptor<DataType = any> {
  ref: DrawingReference;
  valid?: boolean;
  visibleInViewport?: boolean;
  options: Omit<DrawingOptions<DataType>, 'id'>;
}

export interface Graphics {
  render(ctx: CanvasRenderingContext2D, inverted: InvertedValue): void;

  hitTest(ctx: CanvasRenderingContext2D, screenPos: Point): boolean;
}

export interface DrawingHandle extends Graphics, HasCursor, HasCenterPos {
}

export default interface Drawing {
  parts: Graphics[];
  handles: Record<HandleId, DrawingHandle>;
}

export interface AxisMark {
  text: string;
  screenPos: number;
  textColor: string;
}
