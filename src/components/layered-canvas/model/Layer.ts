import type { LayerContext, LayerContextChangeListener } from '@/components/layered-canvas/types';

export default abstract class Layer {
  private static sharedId: number = 0;

  public readonly id: number;

  protected context!: LayerContext;

  private readonly listeners: LayerContextChangeListener[] = [];
  private invalidValue!: boolean;

  protected constructor() {
    this.id = Layer.sharedId;
    Layer.sharedId += 1;
  }

  revalidateOnNextFrame: boolean = false;
  set invalid(value: boolean) {
    if (!this.invalidValue && value) {
      requestAnimationFrame(this.invalidate.bind(this));
    } else if (value) {
      this.revalidateOnNextFrame = true;
    }

    this.invalidValue = value;

    if (this.revalidateOnNextFrame && !value) {
      this.revalidateOnNextFrame = false;
      this.invalid = true;
    }
  }

  get invalid(): boolean {
    return this.invalidValue;
  }

  public setContext(ctx: LayerContext): void {
    this.context = ctx;

    for (const listener of this.listeners) {
      listener.call(listener, this.context);
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
    if (this.context === undefined) {
      return;
    }

    if (!this.invalid) {
      return;
    }

    this.render(() => { this.invalid = false; });
  }

  protected abstract render(onComplete: Function): void;
}
