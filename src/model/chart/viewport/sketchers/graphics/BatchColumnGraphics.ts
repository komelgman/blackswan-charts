import type { LayerRenderingContext } from '@/components/layered-canvas/model/Layer';
import type { BarColors, Point } from '@/model/chart/types';
import type { Graphics } from '@/model/datasource/types';

export interface VolumeColumnGraphicsOptions {
  x: number;
  width: number;
  height: number;
  colors: BarColors;
}

export default class BatchCandleGraphics implements Graphics {
  private columnPath: Path2D;
  private colors: BarColors;
  private columnWidth: number;

  constructor(columnWidth: number, colors: BarColors) {
    this.columnWidth = columnWidth;
    this.colors = colors;
    this.columnPath = new Path2D();
  }

  public add(x: number, height: number): void {
    this.columnPath.rect(x - this.columnWidth / 2, 0, this.columnWidth, height);
  }

  public hitTest(ctx: LayerRenderingContext, screenPos: Point): boolean {
    const { x, y } = screenPos;
    ctx.save();
    ctx.setLineDash([]);
    ctx.lineWidth = 3;
    const result = ctx.isPointInPath(this.columnPath, x, y);

    // * debug
    // ctx.strokeStyle = '#454545';
    // ctx.stroke(this.path);
    ctx.restore();

    return result;
  }

  public render(ctx: LayerRenderingContext): void {
    ctx.save();
    ctx.setLineDash([]);
    ctx.scale(1, 1);
    ctx.lineWidth = 1;

    if (this.columnPath !== undefined) {
      ctx.fillStyle = this.colors.body;
      ctx.fill(this.columnPath);

      ctx.strokeStyle = this.colors.border;
      ctx.stroke(this.columnPath);
    }

    ctx.restore();
  }
}
