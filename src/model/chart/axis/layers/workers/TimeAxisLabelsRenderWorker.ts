import { CanvasWorker } from '@/components/layered-canvas/model/canvas-worker/CanvasWorker';
import {
  initMessageHandler,
  WorkerRequestType,
  WorkerResponseType,
  type CanvasWorkerState,
  type MessageHandler,
  type WorkerMessage,
  type WorkerResponse,
} from '@/components/layered-canvas/model/canvas-worker/types';
import type { Label } from '@/model/chart/axis/label/Label';

export declare type RenderTimeLabelsMessage = WorkerMessage<WorkerRequestType.RENDER, {
  width: number,
  height: number,
  dpr: number,
  labels: Label[],
  labelColor: string,
  labelFont: string,
  yPos: number,
}>;

const renderMessageHandler: MessageHandler<CanvasWorkerState> = (worker, message: RenderTimeLabelsMessage): WorkerResponse => {
  const ctx = worker.state?.ctx;
  const { width, height, dpr, labelColor, labelFont, labels } = message.payload;

  if (!ctx) {
    return { message: { type: WorkerResponseType.SUCCESS, payload: message.type } } as WorkerResponse;
  }

  ctx.canvas.width = Math.floor(width * dpr);
  ctx.canvas.height = Math.floor(height * dpr);

  ctx.resetTransform();
  ctx.scale(dpr, dpr);
  ctx.save();

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillStyle = labelColor;
  ctx.font = labelFont;

  const y: number = height * 0.5;
  for (const [x, label] of labels) {
    ctx.fillText(label, x, y);
  }

  ctx.restore();

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

// eslint-disable-next-line no-new
new TimeLabelsRenderWorker();

export {};
