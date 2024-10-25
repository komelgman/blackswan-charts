import type { BarColors, Point } from '@/model/chart/types';
import type { Graphics } from '@/model/datasource/types';

export interface VolumeColumnGraphicsOptions {
  x: number;
  width: number;
  height: number;
  colors: BarColors;
}

export default class VolumeColumnGraphics implements Graphics {
  private columnPath!: Path2D;
  private colors!: BarColors;

  constructor(options: VolumeColumnGraphicsOptions) {
    this.invalidate(options);
  }

  public invalidate(options: VolumeColumnGraphicsOptions): void {
    const { x, width, height, colors } = options;

    this.colors = colors;

    this.columnPath = new Path2D();
    this.columnPath.rect(x - width / 2, 0, width, height);
  }

  public hitTest(ctx: CanvasRenderingContext2D, screenPos: Point): boolean {
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

  public render(ctx: CanvasRenderingContext2D): void {
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
