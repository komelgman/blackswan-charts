import {
  CanvasWorker,
  initMessageHandler,
  WorkerRequestType,
  WorkerResponseType,
  type CanvasWorkerState,
  type MessageHandler,
  type WorkerMessage,
  type WorkerResponse,
} from '@blackswan/layered-canvas/model';
import { renderViewportGrid, type RenderPayload } from '../renderViewportGrid';

export declare type RenderViewportGridMessage = WorkerMessage<WorkerRequestType.RENDER, RenderPayload>;

const renderMessageHandler: MessageHandler<CanvasWorkerState> = (worker, message: RenderViewportGridMessage): WorkerResponse => {
  const ctx = worker.state?.ctx;


  if (!ctx) {
    return { message: { type: WorkerResponseType.SUCCESS, payload: message.type } } as WorkerResponse;
  }

  renderViewportGrid(ctx, message.payload);

  return { message: { type: WorkerResponseType.SUCCESS, payload: { requestType: message.type } } } as WorkerResponse;
};

class ViewportGridRenderWorker extends CanvasWorker<CanvasWorkerState> {
  public constructor() {
    super(new Map([
      [WorkerRequestType.INIT, initMessageHandler],
      [WorkerRequestType.RENDER, renderMessageHandler],
    ]));
  }
}

 
new ViewportGridRenderWorker();

export {};
