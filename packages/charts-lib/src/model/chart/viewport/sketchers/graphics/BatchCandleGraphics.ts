import type { Graphics } from '@/model/datasource/types';
import type { CandleColors, CandleType, Point } from '@/model/chart/types';
import type { CandlestickBarStyle } from '@/model/chart/viewport/sketchers/renderers';
import type { CanvasRenderingContext } from '@blackswan/layered-canvas/model';

export default class BatchCandleGraphics implements Graphics {
  private readonly barPath: Path2D;
  private readonly wickPath: Path2D;
  private readonly style: CandlestickBarStyle;
  private readonly colors: CandleColors;
  private readonly candleWidth: number;
  private readonly isEnoughSpaceForBar: boolean;

  constructor(candleWidth: number, style: CandlestickBarStyle, type: CandleType) {
    this.candleWidth = Math.max(1, candleWidth);
    this.style = style;
    this.colors = style[type];
    this.barPath = new Path2D();
    this.wickPath = new Path2D();
    this.isEnoughSpaceForBar = candleWidth >= 2; // options.minBarWidth
  }

  public add(x: number, yo: number, yh: number, yl: number, yc: number): void {
    const { isEnoughSpaceForBar, style: { showWick, showBody, showBorder }, barPath, wickPath } = this;

    if ((showBorder || showBody) && isEnoughSpaceForBar) {
      barPath.moveTo(x, yo);
      barPath.lineTo(x, yc);
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
    ctx.scale(1, 1);
    ctx.setLineDash([]);

    ctx.lineWidth = 3;
    const hitWick = ctx.isPointInStroke(this.wickPath, x, y);

    ctx.lineWidth = this.candleWidth + 3;
    const result = hitWick || ctx.isPointInStroke(this.barPath, x, y);

    ctx.restore();
    return result;
  }

  public render(ctx: CanvasRenderingContext): void {
    const { showWick, showBody, showBorder } = this.style;
    const { candleWidth } = this;

    ctx.save();
    ctx.setLineDash([]);
    ctx.scale(1, 1);
    ctx.lineCap = 'square';

    if (showWick) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = this.colors.wick;
      ctx.stroke(this.wickPath);
    }

    if (this.barPath !== undefined && showBorder) {
      ctx.lineWidth = candleWidth;
      ctx.strokeStyle = this.colors.border;
      ctx.stroke(this.barPath);
    }

    if (this.barPath !== undefined && showBody && this.candleWidth > 3) {
      ctx.lineWidth = candleWidth - 2;
      ctx.strokeStyle = this.colors.body;
      ctx.stroke(this.barPath);
    }

    ctx.restore();
  }
}
