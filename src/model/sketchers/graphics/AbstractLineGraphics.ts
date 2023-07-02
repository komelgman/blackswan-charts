import type { Graphics } from '@/model/datasource/Drawing';
import { setLineStyle } from '@/misc/line-functions';
import type { LineStyle, Point } from '@/model/type-defs';

export default abstract class AbstractLineGraphics<GraphicOptions> implements Graphics {
  protected path!: Path2D;
  protected style!: LineStyle;

  public abstract invalidate(options: GraphicOptions): void;

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
