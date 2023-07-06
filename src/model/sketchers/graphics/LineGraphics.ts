import type { LineStyle } from '@/model/type-defs';
import AbstractLineGraphics from '@/model/sketchers/graphics/AbstractLineGraphics';

export interface LineGraphicsOptions {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  lineStyle: LineStyle;
}

export default class LineGraphics extends AbstractLineGraphics<LineGraphicsOptions> {
  public static readonly TYPE: string = 'line';
  constructor(x0: number, y0: number, x1: number, y1: number, lineStyle: LineStyle) {
    super(LineGraphics.TYPE);

    this.invalidate({ x0, y0, x1, y1, lineStyle });
  }

  public invalidate(options: LineGraphicsOptions): void {
    const { x0, y0, x1, y1, lineStyle } = options;
    this.style = lineStyle;

    this.path = new Path2D();
    this.path.moveTo(x0, y0);
    this.path.lineTo(x1, y1);
  }
}
