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
import { drawHorizontalLine, drawVerticalLine } from '@/model/misc/line-functions';
import type { Label } from '@/model/chart/axis/label/Label';
import type { InvertedValue } from '@/model/chart/axis/PriceAxis';

export declare type RenderViewportGridMessage = WorkerMessage<WorkerRequestType.RENDER, {
  width: number,
  height: number,
  dpr: number,
  inverted: InvertedValue,
  priceLabels: Label[],
  timeLabels: Label[],
  color: string,
}>;

const renderMessageHandler: MessageHandler<CanvasWorkerState> = (worker, message: RenderViewportGridMessage): WorkerResponse => {
  const ctx = worker.state?.ctx;
  const { width, height, dpr, inverted, priceLabels, timeLabels, color } = message.payload;

  if (!ctx) {
    return { message: { type: WorkerResponseType.SUCCESS, payload: message.type } } as WorkerResponse;
  }

  ctx.canvas.width = Math.floor(width * dpr);
  ctx.canvas.height = Math.floor(height * dpr);

  ctx.resetTransform();
  ctx.scale(dpr, dpr);
  ctx.save();

  if (inverted < 0) {
    ctx.translate(0, height);
  }

  ctx.lineWidth = 1;
  ctx.strokeStyle = color;
  ctx.beginPath();

  for (const [y] of priceLabels) {
    drawHorizontalLine(ctx, inverted * Math.round(y), 0, width);
  }

  for (const [x] of timeLabels) {
    drawVerticalLine(ctx, Math.round(x), 0, inverted * height);
  }

  ctx.scale(1, 1);
  ctx.stroke();

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
