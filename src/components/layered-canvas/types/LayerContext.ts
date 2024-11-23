export interface LayerContext {
  readonly renderingContext: CanvasRenderingContext2D;
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
}
