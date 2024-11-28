import { CanvasWorker } from '@/components/layered-canvas/model/canvas-worker/CanvasWorker';
import {
  initCommandProcessor,
  WorkerCommandType,
  WorkerResponseType,
  type CanvasWorkerState,
  type MessageProcessor,
  type WorkerMessage,
  type WorkerResponse,
} from '@/components/layered-canvas/model/canvas-worker/types';
import { drawHorizontalLine, drawVerticalLine } from '@/misc/line-functions';
import type { Label } from '@/model/chart/axis/label/Label';
import type { InvertedValue } from '@/model/chart/axis/PriceAxis';

export declare type ViewportGridRenderMessage = WorkerMessage<WorkerCommandType.RENDER, {
  width: number,
  height: number,
  dpr: number,
  inverted: InvertedValue,
  priceLabels: Label[],
  timeLabels: Label[],
}>;

const renderCommandProcessor: MessageProcessor<CanvasWorkerState> = (worker, message: ViewportGridRenderMessage): WorkerResponse => {
  const ctx = worker.state?.ctx;
  const { width, height, dpr, inverted, priceLabels, timeLabels } = message.payload;

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
  ctx.strokeStyle = '#1f212f'; // todo: options
  ctx.beginPath();

  for (const [y] of priceLabels) {
    drawHorizontalLine(ctx, inverted * y, 0, width);
  }

  for (const [x] of timeLabels) {
    drawVerticalLine(ctx, x, 0, inverted * height);
  }

  ctx.scale(1, 1);
  ctx.translate(0.5, 0.5);
  ctx.stroke();

  return { message: { type: WorkerResponseType.SUCCESS, payload: message.type } } as WorkerResponse;
};

class ViewportGridRenderWorker extends CanvasWorker<CanvasWorkerState> {
  public constructor() {
    super(new Map([
      [WorkerCommandType.INIT, initCommandProcessor],
      [WorkerCommandType.RENDER, renderCommandProcessor],
    ]));
  }
}

// eslint-disable-next-line no-new
new ViewportGridRenderWorker();

export {};
