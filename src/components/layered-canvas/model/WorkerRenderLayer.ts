import Layer from '@/components/layered-canvas/model/Layer';
import type { LayerContext } from '@/components/layered-canvas/types';
import type { InitMessage } from '@/components/layered-canvas/model/canvas-worker/types';

export abstract class WorkerRenderLayer extends Layer {
  private wasInit: boolean = false;
  protected readonly worker: Worker;

  public constructor(worker: Worker) {
    super();

    this.worker = worker;
  }

  public setContext(ctx: LayerContext): void {
    if (!this.wasInit) {
      this.wasInit = true;
      const canvas = ctx.mainCanvas.transferControlToOffscreen();
      this.worker.postMessage({ type: 'INIT', payload: { canvas } } as InitMessage, [canvas]);
    }

    super.setContext(ctx);
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
  }
}
