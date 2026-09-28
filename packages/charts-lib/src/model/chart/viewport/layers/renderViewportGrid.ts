import type { Label } from '@/model/chart/axis/label/Label';
import { drawHorizontalLine, drawVerticalLine } from '@/model/misc/line-functions';

export interface RenderPayload {
  width: number,
  height: number,
  dpr: number,
  priceLabels: Label[],
  timeLabels: Label[],
  color: string,
}

export function renderViewportGrid(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, payload: RenderPayload): void {
  const { width, height, dpr, priceLabels, timeLabels, color } = payload;
  ctx.canvas.width = Math.floor(width * dpr);
  ctx.canvas.height = Math.floor(height * dpr);

  ctx.resetTransform();
  ctx.scale(dpr, dpr);
  ctx.save();

  ctx.lineWidth = 1;
  ctx.strokeStyle = color;
  ctx.beginPath();

  for (const [y] of priceLabels) {
    drawHorizontalLine(ctx, Math.round(y), 0, width);
  }

  for (const [x] of timeLabels) {
    drawVerticalLine(ctx, Math.round(x), 0, height);
  }

  ctx.stroke();
  ctx.restore();
}
