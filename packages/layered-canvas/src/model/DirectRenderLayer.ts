import Layer from './Layer';
import type { CanvasRenderingContext, LayerContext } from './types';

export abstract class DirectRenderLayer extends Layer {
  protected renderingContext!: CanvasRenderingContext;

  public updateContext(ctx: LayerContext): void {
    super.updateContext(ctx);
    this.renderingContext = this.context.mainCanvas.getContext('2d') as CanvasRenderingContext2D;
  }

  protected invalidate(): void {
    super.invalidate();
    this.aftherRender();
  }

  protected beforeRender(): void {
    const { height, width, dpr } = this.context;
    const { renderingContext } = this;

    let isSizeChanged = false;
    const requestedWidth = Math.floor(width * dpr);
    const requestedHeight = Math.floor(height * dpr);

    if (renderingContext.canvas.width !== requestedWidth) {
      renderingContext.canvas.width = requestedWidth;
      isSizeChanged = true;
    }

    if (renderingContext.canvas.height !== requestedHeight) {
      renderingContext.canvas.height = requestedHeight;
      isSizeChanged = true;
    }

    renderingContext.resetTransform();
    renderingContext.scale(dpr, dpr);
    renderingContext.save();
    if (!isSizeChanged) {
      renderingContext.clearRect(0, 0, width, height);
    }
  }

  protected render(onComplete: Function): void {
    const { renderingContext } = this;

    if (!renderingContext) {
      return;
    }

    this.beforeRender();
    this.doRender();
    this.aftherRender();
    onComplete();
  }

  protected abstract doRender(): void;

  protected aftherRender(): void {
    this.renderingContext.restore();
  }
}
