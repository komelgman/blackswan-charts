import type { LayerContext } from '@/components/layered-canvas/types';

export default abstract class AbstractInvalidator {
  public contextValue!: LayerContext;

  public set context(value: LayerContext) {
    this.contextValue = value;
    this.invalidate();
  }

  public get context(): LayerContext {
    return this.contextValue;
  }

  public abstract invalidate(): void;
}
