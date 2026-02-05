import type { CanvasRenderingContext } from '@/components/layered-canvas/types';
import type { BarColors, Point } from '@/model/chart/types';
import type { Graphics } from '@/model/datasource/types';

export interface VolumeColumnGraphicsOptions {
  x: number;
  width: number;
  height: number;
  colors: BarColors;
  baseY?: number;
  direction?: 1 | -1;
}

export default class BatchCandleGraphics implements Graphics {
  private columnPath: Path2D;
  private colors: BarColors;
  private columnWidth: number;
  private columnBase: number;
  private columnDirection: 1 | -1;

  constructor(columnWidth: number, colors: BarColors, columnBase: number = 0, columnDirection: 1 | -1 = 1) {
    this.columnWidth = Math.max(1, columnWidth);
    this.colors = colors;
    this.columnPath = new Path2D();
    this.columnBase = columnBase;
    this.columnDirection = columnDirection;
  }

  public add(x: number, height: number): void {
    const y0 = this.columnBase;
    const y1 = this.columnBase + this.columnDirection * height;
    this.columnPath.moveTo(x, y0);
    this.columnPath.lineTo(x, y1);
  }

  public hitTest(ctx: CanvasRenderingContext, screenPos: Point): boolean {
    const { x, y } = screenPos;
    ctx.save();
    ctx.setLineDash([]);
    ctx.lineWidth = 3 + this.columnWidth;
    const result = ctx.isPointInStroke(this.columnPath, x, y);

    ctx.restore();

    return result;
  }

  public render(ctx: CanvasRenderingContext): void {
    ctx.save();
    ctx.setLineDash([]);
    ctx.scale(1, 1);
    ctx.lineWidth = 1;

    if (this.columnPath !== undefined) {
      ctx.lineCap = 'square';
      ctx.lineWidth = this.columnWidth;
      ctx.strokeStyle = this.colors.border;
      ctx.stroke(this.columnPath);

      if (this.columnWidth > 3) {
        ctx.lineWidth = this.columnWidth - 2;
        ctx.strokeStyle = this.colors.body;
        ctx.stroke(this.columnPath);
      }
    }

    ctx.restore();
  }
}
