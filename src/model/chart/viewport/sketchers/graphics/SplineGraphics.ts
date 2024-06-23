import AbstractLineGraphics from '@/model/chart/viewport/sketchers/graphics/AbstractLineGraphics';
import type { LineStyle } from '@/model/chart/types';

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
    this.style = lineStyle; // { lineWidth: 1, fill: LineFillStyle.Solid, color: 'red' }
    this.path = new Path2D();

    const f = -0.3;
    const t = 0.6;
    let gradient = 0;
    let preDx = 0;
    let preDy = 0;

    let preX = points[0];
    let preY = points[1];

    this.path.moveTo(preX, preY);

    for (let i = 2; i < points.length; i += 2) {
      const curX = points[i];
      const curY = points[i + 1];
      const nextX = points[i + 2];
      const nextY = points[i + 3];
      let curDx = 0;
      let curDy = 0;

      if (nextX !== undefined && nextY !== undefined) {
        gradient = (nextY - preY) / (nextX - preX);
        curDx = (nextX - curX) * f;
        curDy = curDx * gradient * t;
      }

      this.path.bezierCurveTo(preX - preDx, preY - preDy, curX + curDx, curY + curDy, curX, curY);

      preX = curX;
      preY = curY;
      preDx = curDx;
      preDy = curDy;
    }

    // debug
    // for (let i = 0; i < points.length; i += 2) {
    //   this.path.arc(points[i], points[i + 1], 2, 0, 2 * Math.PI);
    // }
  }
}
