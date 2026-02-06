import Layer from './Layer';
import type { LayerContext } from './types';
import type { InitMessage } from './canvas-worker/types';

export abstract class WorkerRenderLayer extends Layer {
  private wasInit: boolean = false;
  protected readonly worker: Worker;

  public constructor(worker: Worker) {
    super();

    this.worker = worker;
  }

  public updateContext(ctx: LayerContext): void {
    if (!this.wasInit) {
      this.wasInit = true;
      const canvas = ctx.mainCanvas.transferControlToOffscreen();
      this.worker.postMessage({ type: 'INIT', payload: { canvas } } as InitMessage, [canvas]);
    }

    super.updateContext(ctx);
  }

  protected render(onComplete: Function): void {
    this.worker.onmessage = (e) => {
      if (e.data.type === 'SUCCESS' && e.data.payload.requestType === 'RENDER') {
        onComplete();
      }
    };

    this.doRender();
  }

  protected abstract doRender(): void;

  public destroy() {
    this.worker.terminate();
    this.wasInit = false;
    super.destroy();
  }
}
