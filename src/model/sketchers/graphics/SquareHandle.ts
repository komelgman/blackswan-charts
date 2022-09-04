import { Handle } from '@/model/datasource/Drawing';
import { RectStyle } from '@/model/datasource/line/type-defs';
import { Point } from '@/model/type-defs';
import { setLineStyle } from '@/model/datasource/line/line-functions';

export default class SquareHandle implements Handle {
  private readonly nonLockedCursor: string;
  private readonly style: RectStyle;
  private readonly radius: number = 3;
  private readonly width: number = 11;
  private readonly height: number = 11;

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
    const { radius, width, height } = this;
    this.cxValue = cx;
    this.cyValue = cy;

    const x: number = cx - width / 2;
    const y: number = cy - height / 2;

    this.cursor = locked ? 'pointer' : this.nonLockedCursor;
    this.path = new Path2D();

    if (!locked) {
      this.path.moveTo(x + radius, y);
      this.path.lineTo(x + width - radius, y);
      this.path.quadraticCurveTo(x + width, y, x + width, y + radius);
      this.path.lineTo(x + width, y + height - radius);
      this.path.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      this.path.lineTo(x + radius, y + height);
      this.path.quadraticCurveTo(x, y + height, x, y + height - radius);
      this.path.lineTo(x, y + radius);
      this.path.quadraticCurveTo(x, y, x + radius, y);
      this.path.closePath();
    } else {
      this.path.arc(cx, cy, 3, 0, 2 * Math.PI);
    }
  }
  public hitTest(ctx: CanvasRenderingContext2D, screenPos: Point): boolean {
    ctx.save();
    ctx.setLineDash([]);
    const result = ctx.isPointInPath(this.path, screenPos.x, screenPos.y);
    ctx.restore();

    return result;
  }

  public render(ctx: CanvasRenderingContext2D): void {
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
