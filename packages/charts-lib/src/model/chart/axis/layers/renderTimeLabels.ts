import type { Label } from '@/model/chart/axis/label/Label';

export interface RenderPayload {
  width: number,
  height: number,
  dpr: number,
  labels: Label[],
  labelColor: string,
  labelFont: string,
  yPos: number,
}

export function renderTimeLabels(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, payload: RenderPayload): void {
  const { width, height, dpr, labelColor, labelFont, labels } = payload;
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
}
