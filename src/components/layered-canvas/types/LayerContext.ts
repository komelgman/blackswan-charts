export declare type CanvasRenderingContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface LayerContext {
  readonly mainCanvas: HTMLCanvasElement;
  readonly utilityCanvasContext: CanvasRenderingContext;
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
}
