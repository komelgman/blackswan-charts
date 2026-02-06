import type { WatchStopHandle } from 'vue';
import type { LayerContext } from './types';

export default abstract class Layer {
  private static sharedId: number = 0;

  public readonly id: number;

  protected context!: LayerContext;

  private invalidValue!: boolean;
  private revalidateOnNextFrame: boolean = false;
  private unwatch: WatchStopHandle | undefined;

  protected constructor() {
    this.id = Layer.sharedId;
    Layer.sharedId += 1;
  }

  set invalid(value: boolean) {
    if (!this.invalidValue && value) {
      setTimeout(this.invalidate.bind(this));
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

  public updateContext(ctx: LayerContext): void {
    this.context = ctx;
    this.invalid = true;
  }

  public init() {
    this.unwatch = this.installWatcher();
  }

  public destroy() {
    if (this.unwatch) {
      this.unwatch();
      this.unwatch = undefined;
    }
  }

  protected abstract installWatcher(): WatchStopHandle;

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
