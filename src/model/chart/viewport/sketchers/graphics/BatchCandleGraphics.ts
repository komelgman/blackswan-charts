import type { Graphics } from '@/model/datasource/types';
import type { CandleColors, CandleType, Point } from '@/model/chart/types';
import type { CandlestickBarStyle } from '@/model/chart/viewport/sketchers/renderers';
import type { CanvasRenderingContext } from '@/components/layered-canvas/types';

export default class BatchCandleGraphics implements Graphics {
  private readonly barPath: Path2D;
  private readonly wickPath: Path2D;
  private readonly style: CandlestickBarStyle;
  private readonly colors: CandleColors;
  private readonly candleWidth: number;
  private readonly isEnoughSpaceForBar: boolean;

  constructor(candleWidth: number, style: CandlestickBarStyle, type: CandleType) {
    this.candleWidth = candleWidth;
    this.style = style;
    this.colors = style[type];
    this.barPath = new Path2D();
    this.wickPath = new Path2D();
    this.isEnoughSpaceForBar = candleWidth >= 2; // options.minBarWidth
  }

  public add(x: number, yo: number, yh: number, yl: number, yc: number): void {
    const { candleWidth, isEnoughSpaceForBar, style: { showWick, showBody, showBorder }, barPath, wickPath } = this;

    if ((showBorder || showBody) && isEnoughSpaceForBar) {
      barPath.rect(x - candleWidth / 2, yc, candleWidth, yo - yc);
    }

    if (showWick) {
      if ((showBorder || showBody) && isEnoughSpaceForBar) {
        wickPath.moveTo(x, yh);
        wickPath.lineTo(x, Math.max(yo, yc));
        wickPath.moveTo(x, yl);
        wickPath.lineTo(x, Math.min(yo, yc));
      } else {
        wickPath.moveTo(x, yh);
        wickPath.lineTo(x, yl);
      }
    }
  }

  public hitTest(ctx: CanvasRenderingContext, screenPos: Point): boolean {
    const { x, y } = screenPos;
    ctx.save();
    ctx.setLineDash([]);
    ctx.lineWidth = 3;
    const result = ctx.isPointInPath(this.barPath, x, y) || ctx.isPointInStroke(this.wickPath, x, y);

    // * debug
    // ctx.strokeStyle = '#454545';
    // ctx.stroke(this.barPath);
    // ctx.stroke(this.wickPath);
    ctx.restore();

    return result;
  }

  public render(ctx: CanvasRenderingContext): void {
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
