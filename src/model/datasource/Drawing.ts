/* eslint-disable */
import { Point } from '@/model/type-defs';
import { InvertedValue } from '@/model/axis/PriceAxis';

export declare type DrawingId = string;
export declare type DrawingType = string;
export declare type HandleId = string;

export interface Graphics {
  render(ctx: CanvasRenderingContext2D, inverted: InvertedValue): void;
  hitTest(ctx: CanvasRenderingContext2D, screenPos: Point): boolean;
}

export interface DrawingOptions<DataType = any> {
  id: DrawingId;
  type: DrawingType;
  title: string;
  data: DataType;
  locked: boolean;
  visible: boolean;
  valid?: boolean;
  visibleInViewport?: boolean;
}

export interface HasCursor {
  cursor?: string;
}

export interface HasCenterPos {
  cx: number;
  cy: number;
}

export interface AxisMark {
  text: string;
  screenPos: number;
  textColor: string;
}

export interface Handle extends Graphics, HasCursor, HasCenterPos {
}

export default interface Drawing {
  parts: Graphics[];
  handles: Record<HandleId, Handle>;
}
