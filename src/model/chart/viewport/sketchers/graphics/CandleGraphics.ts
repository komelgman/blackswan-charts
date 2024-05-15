import type { Graphics } from '@/model/datasource/Drawing';
import type { Point, CandleColors, CandlestickChartStyle } from '@/model/type-defs';

export interface CandleGraphicsOptions {
  x: number;
  width: number;
  yo: number;
  yh: number;
  yl: number;
  yc: number;
  style: CandlestickChartStyle;
}

export default class CandleGraphics implements Graphics {
  private barPath!: Path2D;
  private wickPath!: Path2D;
  private style!: CandlestickChartStyle;
  private colors!: CandleColors;

  constructor(options: CandleGraphicsOptions) {
    this.invalidate(options);
  }

  public invalidate(options: CandleGraphicsOptions): void {
    const { x, width, yo, yh, yl, yc, style } = options;
    const candleType = yo > yc ? 'bearish' : 'bullish';

    this.style = style;
    this.colors = this.style[candleType];

    const { showWick, showBody, showBorder } = this.style;
    const isEnoughSpaceForBar = width >= 2; // options.minBarWidth

    if (showBorder || showBody) {
      this.barPath = new Path2D();
      this.barPath.rect(x - width / 2, yc, width, yo - yc);
    }

    if (showWick) {
      if ((showBorder || showBody) && isEnoughSpaceForBar) {
        this.wickPath = new Path2D();
        this.wickPath.moveTo(x, yh);
        this.wickPath.lineTo(x, Math.max(yo, yc));
        this.wickPath.moveTo(x, yl);
        this.wickPath.lineTo(x, Math.min(yo, yc));
      } else {
        this.wickPath = new Path2D();
        this.wickPath.moveTo(x, yh);
        this.wickPath.lineTo(x, yl);
      }
    }
  }

  public hitTest(ctx: CanvasRenderingContext2D, screenPos: Point): boolean {
    const { x, y } = screenPos;
    ctx.save();
    ctx.setLineDash([]);
    ctx.lineWidth = 3;
    const result = ctx.isPointInPath(this.barPath, x, y) || ctx.isPointInStroke(this.wickPath, x, y);


    // * debug
    // ctx.strokeStyle = '#454545';
    // ctx.stroke(this.path);
    ctx.restore();

    return result;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const { showWick, showBody, showBorder } = this.style;

    ctx.save();
    ctx.setLineDash([]);
    ctx.scale(1, 1);
    ctx.lineWidth = 1;

    if (showWick) {
      ctx.strokeStyle = this.colors.wick;
      ctx.stroke(this.wickPath);
    }

    if (this.barPath !== undefined && showBody) {
      ctx.fillStyle = this.colors.body;
      ctx.fill(this.barPath);
    }

    if (this.barPath !== undefined && showBorder) {
      ctx.strokeStyle = this.colors.border;
      ctx.stroke(this.barPath);
    }

    ctx.restore();
  }
}
