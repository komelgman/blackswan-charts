import type { Label } from '@/model/chart/axis/label/Label';

export interface RenderPayload {
  width: number,
  height: number,
  dpr: number,
  labels: Label[],
  labelColor: string,
  labelFont: string,
  xPos: number,
}

export function renderPriceLabels(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, payload: RenderPayload): void {
  const { width, height, dpr, labelColor, labelFont, xPos, labels } = payload;
  ctx.canvas.width = Math.floor(width * dpr);
  ctx.canvas.height = Math.floor(height * dpr);

  ctx.resetTransform();
  ctx.scale(dpr, dpr);
  ctx.save();

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'end';
  ctx.fillStyle = labelColor;
  ctx.font = labelFont;

  for (const [yPos, label] of labels) {
    ctx.fillText(label, xPos, yPos);
  }

  ctx.restore();
}
