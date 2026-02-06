import { setLineStyle } from '@/model/misc/line-functions';
import type { DrawingHandle } from '@/model/datasource/types';
import type { Point, RectStyle } from '@/model/chart/types';
import type { CanvasRenderingContext } from '@blackswan/layered-canvas/model';

export default class RoundHandle implements DrawingHandle {
  private readonly nonLockedCursor: string;
  private readonly style: RectStyle;
  private readonly radius: number = 6;
  private path!: Path2D;
  private cxValue!: number;
  private cyValue!: number;
  public cursor: string = 'pointer';

  constructor(cx: number, cy: number, locked: boolean, style: RectStyle, cursor: string) {
    this.style = style;
    this.nonLockedCursor = cursor;

    this.invalidate(cx, cy, locked);
  }

  get cx(): number {
    return this.cxValue;
  }

  get cy(): number {
    return this.cyValue;
  }

  public invalidate(cx: number, cy: number, locked: boolean): void {
    this.cxValue = cx;
    this.cyValue = cy;
    this.cursor = locked ? 'pointer' : this.nonLockedCursor;
    this.path = new Path2D();

    const { radius } = this;

    if (!locked) {
      this.path.arc(cx, cy, radius, 0, 2 * Math.PI);
    } else {
      this.path.arc(cx, cy, 3, 0, 2 * Math.PI);
    }
  }

  public hitTest(ctx: CanvasRenderingContext, screenPos: Point): boolean {
    ctx.save();
    ctx.setLineDash([]);
    const result = ctx.isPointInPath(this.path, screenPos.x, screenPos.y);
    ctx.restore();

    return result;
  }

  public render(ctx: CanvasRenderingContext): void {
    ctx.save();
    if (this.style.border !== undefined) {
      setLineStyle(ctx, this.style.border);
    }

    ctx.fillStyle = this.style.color;
    ctx.fill(this.path);
    ctx.scale(1, 1);
    ctx.stroke(this.path);
    ctx.restore();
  }
}
