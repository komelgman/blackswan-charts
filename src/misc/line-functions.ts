import { Line, LineFillStyle } from '@/model/type-defs';
import type { LineStyle, LineDef, Price, Range, UTCTimestamp } from '@/model/type-defs';

export function setLineStyle(ctx: CanvasRenderingContext2D, style: LineStyle): void {
  let dashPattern: number[];
  const { lineWidth, fill, color } = style;

  switch (fill) {
    case LineFillStyle.Solid: {
      dashPattern = [];
      break;
    }
    case LineFillStyle.Dotted: {
      dashPattern = [2 * lineWidth, 3 * lineWidth];
      break;
    }
    case LineFillStyle.Dashed: {
      dashPattern = [5 * lineWidth, 5 * lineWidth];
      break;
    }
    case LineFillStyle.LargeDashed: {
      dashPattern = [15 * lineWidth, 5 * lineWidth];
      break;
    }
    case LineFillStyle.SparseDotted: {
      dashPattern = [10 * lineWidth, 4 * lineWidth, 3 * lineWidth,
        4 * lineWidth, 3 * lineWidth, 4 * lineWidth, 3 * lineWidth, 4 * lineWidth];
      break;
    }
    default:
      dashPattern = [];
  }
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.setLineDash(dashPattern);
}

export function drawHorizontalLine(ctx: CanvasRenderingContext2D, y: number, left: number, right: number): void {
  const correction = 0; // (ctx.lineWidth % 2) ? 0.5 : 0;
  ctx.moveTo(left, y + correction);
  ctx.lineTo(right, y + correction);
  ctx.stroke();
}

export function drawVerticalLine(ctx: CanvasRenderingContext2D, x: number, top: number, bottom: number): void {
  const correction = 0; // (ctx.lineWidth % 2) ? 0.5 : 0;
  ctx.moveTo(x + correction, top);
  ctx.lineTo(x + correction, bottom);
  ctx.stroke();
}

export function strokeInPixel(ctx: CanvasRenderingContext2D, drawFunction: () => void): void {
  ctx.save();
  if (ctx.lineWidth % 2) {
    ctx.translate(0.5, 0.5);
  }
  drawFunction();
  ctx.restore();
}

export function inRange<T>(p: T, range: Range<T>): boolean {
  return p >= range.from && p <= range.to;
}

export function lineCrossPoint(line1: Line, line2: Line): [boolean, UTCTimestamp, Price] {
  return [false, 0 as UTCTimestamp, 0 as Price];
}
