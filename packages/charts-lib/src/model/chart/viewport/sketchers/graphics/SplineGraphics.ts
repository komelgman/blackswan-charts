import AbstractLineGraphics from '@/model/chart/viewport/sketchers/graphics/AbstractLineGraphics';
import { type LineStyle } from '@/model/chart/types';

export interface SplineGraphicsOptions {
  points: number[];
  lineStyle: LineStyle;
}

export default class SplineGraphics extends AbstractLineGraphics<SplineGraphicsOptions> {
  public static readonly TYPE: string = 'spline';
  constructor(points: number[], lineStyle: LineStyle) {
    super(SplineGraphics.TYPE);
    this.invalidate({ points, lineStyle });
  }

  public invalidate(options: SplineGraphicsOptions): void {
    const { points, lineStyle } = options;
    this.style = lineStyle; // { lineWidth: 1, fill: LineFillStyle.Solid, color: 'red' };
    this.path = new Path2D();

    this.path.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) {
      this.path.lineTo(points[i], points[i + 1]);
    }

    // // debug
    // for (let i = 0; i < points.length; i += 2) {
    //   this.path.arc(points[i], points[i + 1], 2, 0, 2 * Math.PI);
    // }
  }
}
