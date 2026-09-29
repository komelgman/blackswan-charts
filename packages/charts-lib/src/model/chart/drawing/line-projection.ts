import type { Line, Price, UTCTimestamp } from '@/model/chart/types';
import type { DrawingProjection } from '@/model/chart/drawing/DrawingProjection';
import { visibleLinePoints } from '@/model/chart/drawing/line-geometry';

export interface ProjectedLine {
  points: number[];
  curved: boolean;
}
export function projectLine(line: Line, projection: DrawingProjection): ProjectedLine | undefined {
  const { timeAxis, priceAxis } = projection;
  const [visible, x0, y0, x1, y1, lineFunc] = visibleLinePoints(line, timeAxis.range, priceAxis.range);
  if (!visible) return undefined;
  const vpX0 = timeAxis.translate(x0),
    vpY0 = priceAxis.translate(y0);
  const vpX1 = timeAxis.translate(x1),
    vpY1 = priceAxis.translate(y1);
  if (priceAxis.scale.func === line.scale.func || lineFunc === undefined) {
    return { points: [vpX0, vpY0, vpX1, vpY1], curved: false };
  }
  const MAGIC_CONST = 12;
  const BREAKER_LIMIT = 1e5;
  const MIN_STEP = 1e-6;
  const points: number[] = [];
  let step = ((x1 - x0) * MAGIC_CONST) / Math.sqrt((vpX1 - vpX0) ** 2 + (vpY1 - vpY0) ** 2);
  let curX: UTCTimestamp = x0;
  let curY: Price = y0;
  let nextX: UTCTimestamp;
  let nextY: Price;
  let breaker = 0;
  let infiniteStepAjustementBreakerEnabled = false;

  do {
    nextX = (curX + step) as UTCTimestamp;
    nextY = lineFunc(nextX);

    const chunkSize = Math.sqrt(
      (timeAxis.translate(nextX) - timeAxis.translate(curX)) ** 2 + (priceAxis.translate(nextY) - priceAxis.translate(curY)) ** 2,
    );

    if (chunkSize > MAGIC_CONST && !infiniteStepAjustementBreakerEnabled) {
      step = Math.max(step / (chunkSize / MAGIC_CONST), MIN_STEP);
      infiniteStepAjustementBreakerEnabled = true;
      continue;
    } else if (chunkSize < MAGIC_CONST / 2 && !infiniteStepAjustementBreakerEnabled) {
      infiniteStepAjustementBreakerEnabled = true;
      step *= 2;
      continue;
    }

    points.push(timeAxis.translate(curX), priceAxis.translate(curY));
    if (curX === x1 && curY === y1) {
      break;
    }

    if (nextX >= x1) {
      nextX = x1;
      nextY = y1;
    }

    curX = nextX;
    curY = nextY;
    infiniteStepAjustementBreakerEnabled = false;
  } while (++breaker < BREAKER_LIMIT);

  if (breaker === BREAKER_LIMIT) {
    console.warn('BREAKER LIMIT was excided in spline build process');
  }

  return { points, curved: true };
}
