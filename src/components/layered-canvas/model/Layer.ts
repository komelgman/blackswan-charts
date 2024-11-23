import type { LayerContext, LayerContextChangeListener } from '@/components/layered-canvas/types';

export declare type LayerRenderingContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export default abstract class Layer {
  private static sharedId: number = 0;

  public readonly id: number;

  protected ctx!: LayerContext;
  protected buffer: OffscreenCanvasRenderingContext2D | null;

  private readonly listeners: LayerContextChangeListener[] = [];
  private invalidValue!: boolean;

  protected constructor() {
    this.id = Layer.sharedId;
    Layer.sharedId += 1;
    this.buffer = new OffscreenCanvas(1, 1).getContext('2d');
  }

  set invalid(value: boolean) {
    if (!this.invalidValue && value) {
      setTimeout(() => requestAnimationFrame(this.invalidate.bind(this)), 0);
    }

    this.invalidValue = value;
  }

  get invalid(): boolean {
    return this.invalidValue;
  }

  public setContext(ctx: LayerContext): void {
    this.ctx = ctx;

    for (const listener of this.listeners) {
      listener.call(listener, this.ctx);
    }

    this.invalid = true;
  }

  public addContextChangeListener(listener: LayerContextChangeListener): void {
    this.listeners.push(listener);
  }

  public clearListeners(): void {
    this.listeners.splice(0, this.listeners.length);
  }

  protected invalidate(): void {
    if (this.ctx === undefined) {
      return;
    }

    if (!this.invalid) {
      return;
    }

    const { renderingContext, width, height, dpr } = this.ctx;
    let isSizeChanged = false;
    const requestedWidth = Math.floor(width * dpr);
    const requestedHeight = Math.floor(height * dpr);
    const activeContext = this.buffer !== null ? this.buffer : renderingContext;

    if (activeContext.canvas.width !== requestedWidth) {
      activeContext.canvas.width = requestedWidth;
      isSizeChanged = true;
    }

    if (activeContext.canvas.height !== requestedHeight) {
      activeContext.canvas.height = requestedHeight;
      isSizeChanged = true;
    }

    activeContext.resetTransform();
    activeContext.scale(dpr, dpr);
    activeContext.save();
    if (!isSizeChanged) {
      activeContext.clearRect(0, 0, width, height);
    }

    this.render(activeContext, width, height, dpr);
    activeContext.restore();

    if (activeContext === this.buffer) {
      if (isSizeChanged) {
        renderingContext.canvas.height = requestedHeight;
        renderingContext.canvas.width = requestedWidth;
      } else {
        renderingContext.clearRect(0, 0, width, height);
      }

      const bitmapOne = activeContext.canvas.transferToImageBitmap();
      renderingContext.drawImage(bitmapOne, 0, 0);
    }

    this.invalid = false;
  }

  protected abstract render(renderingContext: LayerRenderingContext, width: number, height: number, dpr: number): void;
}
