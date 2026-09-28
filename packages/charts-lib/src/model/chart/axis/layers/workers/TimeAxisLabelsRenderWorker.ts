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
import { renderTimeLabels, type RenderPayload } from '../renderTimeLabels';

export declare type RenderTimeLabelsMessage = WorkerMessage<WorkerRequestType.RENDER, RenderPayload>;

const renderMessageHandler: MessageHandler<CanvasWorkerState> = (worker, message: RenderTimeLabelsMessage): WorkerResponse => {
  const ctx = worker.state?.ctx;


  if (!ctx) {
    return { message: { type: WorkerResponseType.SUCCESS, payload: message.type } } as WorkerResponse;
  }

  renderTimeLabels(ctx, message.payload);

  return { message: { type: WorkerResponseType.SUCCESS, payload: { requestType: message.type } } } as WorkerResponse;
};

class TimeLabelsRenderWorker extends CanvasWorker<CanvasWorkerState> {
  public constructor() {
    super(new Map([
      [WorkerRequestType.INIT, initMessageHandler],
      [WorkerRequestType.RENDER, renderMessageHandler],
    ]));
  }
}

new TimeLabelsRenderWorker();

export {};
