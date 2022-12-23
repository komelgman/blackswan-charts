import type { Graphics } from '@/model/datasource/Drawing';
import { setLineStyle } from '@/model/datasource/line/line-functions';
import type { LineStyle } from '@/model/datasource/line/type-defs';
import type { Point } from '@/model/type-defs';

export default class HLine implements Graphics {
  private path!: Path2D;
  private style!: LineStyle;

  constructor(y: number, left: number, right: number, lineStyle: LineStyle) {
    this.invalidate(y, left, right, lineStyle);
  }

  public invalidate(y: number, left: number, right: number, lineStyle: LineStyle): void {
    this.style = lineStyle;

    this.path = new Path2D();
    this.path.moveTo(left, y);
    this.path.lineTo(right, y);
  }

  public hitTest(ctx: CanvasRenderingContext2D, screenPos: Point): boolean {
    ctx.save();
    ctx.setLineDash([]);
    ctx.lineWidth = this.style.lineWidth + 2;
    const result = ctx.isPointInStroke(this.path, screenPos.x, screenPos.y);

    // * debug
    // ctx.strokeStyle = '#454545';
    // ctx.stroke(this.path);
    ctx.restore();

    return result;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    setLineStyle(ctx, this.style);
    ctx.scale(1, 1);
    ctx.stroke(this.path);
    ctx.restore();
  }
}
