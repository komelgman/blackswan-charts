import type { LayerContext, LayerContextChangeListener } from '@/components/layered-canvas/types';

export default abstract class Layer {
  private static sharedId: number = 0;

  public readonly id: number;

  protected ctx!: LayerContext;

  private readonly listeners: LayerContextChangeListener[] = [];
  private invalidValue!: boolean;

  protected constructor() {
    this.id = Layer.sharedId;
    Layer.sharedId += 1;
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
    this.invalid = false;

    const { native, width, height, dpr } = this.ctx;
    let isSizeChanged = false;
    const requestedWidth = Math.floor(width * dpr);
    const requestedHeight = Math.floor(height * dpr);

    if (native.canvas.width !== requestedWidth) {
      native.canvas.width = requestedWidth;
      isSizeChanged = true;
    }

    if (native.canvas.height !== requestedHeight) {
      native.canvas.height = requestedHeight;
      isSizeChanged = true;
    }

    // sometimes (very often) ctx getContext returns the same context
    // and there might be previous transformation
    // so let's reset it to be sure that everything is ok
    // do no use resetTransform to respect Edge
    native.setTransform(1, 0, 0, 1, 0, 0);
    native.scale(dpr, dpr);
    native.save();
    if (!isSizeChanged) {
      native.clearRect(0, 0, width, height);
    }

    this.render(native, width, height, dpr);
    native.restore();
  }

  protected abstract render(native: CanvasRenderingContext2D, width: number, height: number, dpr: number): void;
}
