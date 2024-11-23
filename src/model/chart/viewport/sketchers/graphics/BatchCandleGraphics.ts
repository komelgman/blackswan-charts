import type { Graphics } from '@/model/datasource/types';
import type { CandleColors, CandleType, Point } from '@/model/chart/types';
import type { CandlestickBarStyle } from '@/model/chart/viewport/sketchers/renderers';
import type { LayerRenderingContext } from '@/components/layered-canvas/model/Layer';

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
    const { candleWidth, isEnoughSpaceForBar, style: { showWick, showBody, showBorder } } = this;

    if (showBorder || showBody) {
      this.barPath.rect(x - candleWidth / 2, yc, candleWidth, yo - yc);
    }

    if (showWick) {
      if ((showBorder || showBody) && isEnoughSpaceForBar) {
        this.wickPath.moveTo(x, yh);
        this.wickPath.lineTo(x, Math.max(yo, yc));
        this.wickPath.moveTo(x, yl);
        this.wickPath.lineTo(x, Math.min(yo, yc));
      } else {
        this.wickPath.moveTo(x, yh);
        this.wickPath.lineTo(x, yl);
      }
    }
  }

  public hitTest(ctx: LayerRenderingContext, screenPos: Point): boolean {
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

  public render(ctx: LayerRenderingContext): void {
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
