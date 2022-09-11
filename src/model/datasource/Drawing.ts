import { PaneId } from '@/components/layout/PaneDescriptor';
import { InvertedValue } from '@/model/axis/PriceAxis';
import HasCenterPos from '@/model/options/HasCenterPos';
import HasCursor from '@/model/options/HasCursor';
import { Point } from '@/model/type-defs';

export declare type DrawingId = string;
export declare type ExternalDrawingId = [PaneId, DrawingId];
export declare type DrawingReference = DrawingId | ExternalDrawingId;
export declare type DrawingType = string;
export declare type HandleId = string;

export interface DrawingOptions<DataType = any> {
  ref: DrawingReference;
  type: DrawingType;
  data: DataType;
  locked: boolean;
  visible: boolean;
  title?: string;
  shared?: boolean;
  shareWith?: PaneId[];
}

export interface DrawingDescriptor<DataType = any> {
  ref: DrawingReference;
  valid?: boolean;
  visibleInViewport?: boolean;
  options: Omit<DrawingOptions<DataType>, 'ref'>;
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
