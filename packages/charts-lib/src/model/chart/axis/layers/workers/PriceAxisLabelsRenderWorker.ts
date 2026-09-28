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
import { renderPriceLabels, type RenderPayload } from '../renderPriceLabels';

export declare type RenderPriceLabelsMessage = WorkerMessage<WorkerRequestType.RENDER, RenderPayload>;

const renderMessageHandler: MessageHandler<CanvasWorkerState> = (worker, message: RenderPriceLabelsMessage): WorkerResponse => {
  const ctx = worker.state?.ctx;


  if (!ctx) {
    return { message: { type: WorkerResponseType.SUCCESS, payload: message.type } } as WorkerResponse;
  }

  renderPriceLabels(ctx, message.payload);

  return { message: { type: WorkerResponseType.SUCCESS, payload: { requestType: message.type } } } as WorkerResponse;
};

class PriceLabelsRenderWorker extends CanvasWorker<CanvasWorkerState> {
  public constructor() {
    super(new Map([
      [WorkerRequestType.INIT, initMessageHandler],
      [WorkerRequestType.RENDER, renderMessageHandler],
    ]));
  }
}

 
new PriceLabelsRenderWorker();

export { };
