import type { LineStyle } from '@/model/chart/types';
import type { Graphics } from '@/model/datasource/types';
import type { ProjectedLine } from '@/model/chart/drawing/line-projection';
import LineGraphics from '@/model/chart/viewport/sketchers/graphics/LineGraphics';
import SplineGraphics from '@/model/chart/viewport/sketchers/graphics/SplineGraphics';

export function updateLineGraphics(current: Graphics | undefined, geometry: ProjectedLine, lineStyle: LineStyle): Graphics {
  const { points, curved } = geometry;
  if (curved) {
    if (current instanceof SplineGraphics) {
      current.invalidate({ points, lineStyle });
      return current;
    }
    return new SplineGraphics(points, lineStyle);
  }
  const [x0, y0, x1, y1] = points;
  if (current instanceof LineGraphics) {
    current.invalidate({ x0, y0, x1, y1, lineStyle });
    return current;
  }
  return new LineGraphics(x0, y0, x1, y1, lineStyle);
}
