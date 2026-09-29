import { inRange } from '@blackswan/foundation';
import { LineBound, type Line, type Price, type Range, type UTCTimestamp } from '@/model/chart/types';

declare type VisiblePoints = [
  isVisible: boolean,
  x0: UTCTimestamp,
  y0: Price,
  x1: UTCTimestamp,
  y1: Price,
  lineFunc: ((x: UTCTimestamp) => Price) | undefined,
];

declare type VisiblePoint = [x: UTCTimestamp, y: Price, type: 'Side' | 'StartBound' | 'EndBound'];

export function visibleLinePoints(
  line: Line,
  timeRange: Readonly<Range<UTCTimestamp>>,
  priceRange: Readonly<Range<Price>>,
): VisiblePoints {
  const lineScale = line.scale.func;
  const [lx0, ly0, lx1, ly1] = line.def;
  const ldx = lx1 - lx0;
  const ldy = lineScale.translate(ly1) - lineScale.translate(ly0);

  const noVisiblePoints: VisiblePoints = [
    false,
    -1 as UTCTimestamp,
    -1 as Price,
    -1 as UTCTimestamp,
    -1 as Price,
    () => -1 as Price,
  ];
  if (ldx === 0) {
    // line is parallel to 0Y
    if (inRange(lx0, timeRange)) {
      return applyLineBounds(line, lx0, priceRange.from, lx1, priceRange.to, undefined);
    }

    return noVisiblePoints;
  }

  if (ldy === 0) {
    // line is parallel 0X
    if (inRange(ly0, priceRange)) {
      return applyLineBounds(line, timeRange.from, ly0, timeRange.to, ly1, undefined);
    }

    return noVisiblePoints;
  }

  const result: any[] = [];

  const dydx = ldy / ldx;
  const lineFunc = (x: UTCTimestamp) => line.scale.func.revert(line.scale.func.translate(ly0) + dydx * (x - lx0));
  const leftSideCross = lineFunc(timeRange.from);
  if (inRange(leftSideCross, priceRange)) {
    result.push(timeRange.from, leftSideCross);
  }

  const rightSideCross = lineFunc(timeRange.to);
  if (inRange(rightSideCross, priceRange)) {
    result.push(timeRange.to, rightSideCross);
  }

  if (result.length === 4) {
    return applyLineBounds(line, result[0], result[1], result[2], result[3], lineFunc);
  }

  const dxdy = ldx / ldy;
  const botSideCross = lx0 + dxdy * (lineScale.translate(priceRange.from) - lineScale.translate(ly0));
  if (inRange(botSideCross, timeRange)) {
    result.push(botSideCross, priceRange.from);
  }

  if (result.length === 4) {
    return applyLineBounds(line, result[0], result[1], result[2], result[3], lineFunc);
  }

  const topSideCross = lx0 + dxdy * (lineScale.translate(priceRange.to) - lineScale.translate(ly0));
  if (inRange(topSideCross, timeRange)) {
    result.push(topSideCross, priceRange.to);
  }

  if (result.length === 4) {
    return applyLineBounds(line, result[0], result[1], result[2], result[3], lineFunc);
  }

  return noVisiblePoints;
}

function applyLineBounds(
  line: Line,
  x0: UTCTimestamp,
  y0: Price,
  x1: UTCTimestamp,
  y1: Price,
  lineFunc: ((x: UTCTimestamp) => Price) | undefined,
): VisiblePoints {
  const [lx0, ly0, lx1, ly1] = line.def;
  const points: VisiblePoint[] = [];

  points.push(
    [(x0 - lx0) as UTCTimestamp, (y0 - ly0) as Price, 'Side'],
    [(x1 - lx0) as UTCTimestamp, (y1 - ly0) as Price, 'Side'],
  );

  if (line.boundType === LineBound.BoundStart || line.boundType === LineBound.Both) {
    points.push([0 as UTCTimestamp, 0 as Price, 'StartBound']);
  }

  if (line.boundType === LineBound.BoundEnd || line.boundType === LineBound.Both) {
    points.push([(lx1 - lx0) as UTCTimestamp, (ly1 - ly0) as Price, 'EndBound']);
  }

  const sortBy = x0 === x1 ? 1 : 0;
  points.sort((a, b) => {
    if (a[sortBy] < b[sortBy]) {
      return -1;
    }

    if (a[sortBy] > b[sortBy]) {
      return 1;
    }

    return 0;
  });

  let p0: VisiblePoint | undefined;
  let p1: VisiblePoint | undefined;

  if (points.length > 2) {
    const dir = line.def[sortBy + 2] - line.def[sortBy];

    for (const point of points) {
      if (p0 === undefined) {
        if ((point[2] === 'StartBound' && dir > 0) || (point[2] === 'EndBound' && dir < 0)) {
          // check that all points after this first point is visible, so just skip it
          continue;
        }

        p0 = point;
      } else if (p1 === undefined) {
        if ((point[2] === 'StartBound' && dir > 0) || (point[2] === 'EndBound' && dir < 0)) {
          // check that all points before this point isn't visible, so override p0
          p0 = point;
          continue;
        }

        p1 = point;
      } else if ((point[2] === 'StartBound' && dir > 0) || (point[2] === 'EndBound' && dir < 0)) {
        // check that all points before this point isn't visible, so reset p0, p1
        p0 = undefined;
        p1 = undefined;
      }

      // check that all points after this point isn't visible, so break
      if ((point[2] === 'StartBound' && dir < 0) || (point[2] === 'EndBound' && dir > 0)) {
        break;
      }
    }
  } else {
    [p0, p1] = points;
  }

  if (p0 && p1) {
    return [
      true,
      (lx0 + p0[0]) as UTCTimestamp,
      (ly0 + p0[1]) as Price,
      (lx0 + p1[0]) as UTCTimestamp,
      (ly0 + p1[1]) as Price,
      lineFunc,
    ];
  }

  return [false, -1 as UTCTimestamp, -1 as Price, -1 as UTCTimestamp, -1 as Price, () => -1 as Price];
}
