import { setLineStyle } from '@/model/misc/line-functions';
import type { Graphics } from '@/model/datasource/types';
import type { LineStyle, Point } from '@/model/chart/types';
import type { CanvasRenderingContext } from '@/components/layered-canvas/types';

export default abstract class AbstractLineGraphics<GraphicOptions> implements Graphics {
  protected path!: Path2D;
  protected style!: LineStyle;
  public type: string;

  protected constructor(type: string) {
    this.type = type;
  }

  public abstract invalidate(options: GraphicOptions): void;

  public hitTest(ctx: CanvasRenderingContext, screenPos: Point): boolean {
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

  public render(ctx: CanvasRenderingContext): void {
    ctx.save();
    setLineStyle(ctx, this.style);
    ctx.scale(1, 1);
    ctx.stroke(this.path);
    ctx.restore();
  }
}
