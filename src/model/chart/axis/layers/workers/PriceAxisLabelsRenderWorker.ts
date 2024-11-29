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
import type { InvertedValue } from '@/model/chart/axis/PriceAxis';
import type { Label } from '@/model/chart/axis/label/Label';

export declare type RenderPriceLabelsMessage = WorkerMessage<WorkerRequestType.RENDER, {
  width: number,
  height: number,
  dpr: number,
  inverted: InvertedValue,
  labels: Label[],
  labelColor: string;
  labelFont: string;
  xPos: number;
}>;

const renderMessageHandler: MessageHandler<CanvasWorkerState> = (worker, message: RenderPriceLabelsMessage): WorkerResponse => {
  const ctx = worker.state?.ctx;
  const { width, height, dpr, inverted, labelColor, labelFont, xPos, labels } = message.payload;

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

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'end';
  ctx.fillStyle = labelColor;
  ctx.font = labelFont;

  for (const [yPos, label] of labels) {
    ctx.fillText(label, xPos, inverted * yPos);
  }

  ctx.restore();

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

// eslint-disable-next-line no-new
new PriceLabelsRenderWorker();

export { };
