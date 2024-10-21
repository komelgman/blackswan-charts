import { toRaw } from 'vue';
import type { DragMoveEvent } from '@/components/layered-canvas/events';
import { inRange } from '@/misc/line-functions';
import type { DragHandle } from '@/model/chart/viewport/DragHandle';
import AbstractSketcher from '@/model/chart/viewport/sketchers/AbstractSketcher';
import AbstractLineGraphics from '@/model/chart/viewport/sketchers/graphics/AbstractLineGraphics';
import LineGraphics from '@/model/chart/viewport/sketchers/graphics/LineGraphics';
import SplineGraphics from '@/model/chart/viewport/sketchers/graphics/SplineGraphics';
import RoundHandle from '@/model/chart/viewport/sketchers/handles/RoundHandle';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import type { DataSourceEntry, HandleId } from '@/model/datasource/types';
import type { Line, Price, Range, UTCTimestamp } from '@/model/chart/types';
import { LineBound } from '@/model/chart/types';
import { PriceScales } from '@/model/chart/axis/scaling/PriceAxisScale';

declare type VisiblePoints = [
  isVisible: boolean,
  x0: UTCTimestamp,
  y0: Price,
  x1: UTCTimestamp,
  y1: Price,
  lineFunc: ((x: UTCTimestamp) => Price) | undefined,
];

declare type VisiblePoint = [
  x: UTCTimestamp,
  y: Price,
  type: 'Side' | 'StartBound' | 'EndBound',
];

export default class LineSketcher extends AbstractSketcher<Line> {
  protected draw(entry: DataSourceEntry<Line>, viewport: Viewport): void {
    if (this.chartStyle === undefined) {
      throw new Error('Illegal state: this.chartStyle === undefined');
    }

    const { descriptor, drawing } = entry;
    const { timeAxis, priceAxis } = viewport;
    const { data: line, locked } = descriptor.options;
    const { range: priceRange, scale: priceScale } = priceAxis;
    const { range: timeRange } = timeAxis;
    const [visible, x0, y0, x1, y1, lineFunc] = this.visiblePoints(line, timeRange, priceRange);

    descriptor.visibleInViewport = visible;
    descriptor.valid = descriptor.visibleInViewport;

    if (!descriptor.visibleInViewport) {
      return;
    }

    let isNeedToCreateHandles = false;
    const vpX0 = timeAxis.translate(x0);
    const vpY0 = priceAxis.translate(y0);
    const vpX1 = timeAxis.translate(x1);
    const vpY1 = priceAxis.translate(y1);

    const isDrawAsStrightLine = priceScale.title === line.scale.title || lineFunc === undefined;
    if (isDrawAsStrightLine) {
      const isNeedToCreateLine = drawing === undefined || (drawing.parts[0] as AbstractLineGraphics<any>).type !== LineGraphics.TYPE;
      if (isNeedToCreateLine) {
        isNeedToCreateHandles = true;
        entry.drawing = {
          parts: [new LineGraphics(vpX0, vpY0, vpX1, vpY1, line.style)],
          handles: {},
        };
      } else {
        (drawing.parts[0] as LineGraphics)
          .invalidate({ x0: vpX0, y0: vpY0, x1: vpX1, y1: vpY1, lineStyle: line.style });
      }
    } else {
      // draw spline
      const MAGIC_CONST = 12;
      const BREAKER_LIMIT = 1e+5;
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
        nextX = curX + step as UTCTimestamp;
        nextY = lineFunc(nextX);

        const chunkSize = Math.sqrt(
          (timeAxis.translate(nextX) - timeAxis.translate(curX)) ** 2
          + (priceAxis.translate(nextY) - priceAxis.translate(curY)) ** 2,
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

      const isNeedToCreateLine = drawing === undefined || (drawing.parts[0] as AbstractLineGraphics<any>).type !== SplineGraphics.TYPE;
      if (isNeedToCreateLine) {
        isNeedToCreateHandles = true;
        entry.drawing = {
          parts: [new SplineGraphics(points, line.style)],
          handles: {},
        };
      } else {
        (drawing.parts[0] as SplineGraphics).invalidate({
          points,
          lineStyle: line.style,
        });
      }
    }

    const [lx0, ly0, lx1, ly1] = line.def;
    if (isNeedToCreateHandles) {
      if (entry.drawing?.handles === undefined) {
        throw new Error('Oops.');
      }

      entry.drawing.handles = {
        lineStart: new RoundHandle(
          timeAxis.translate(lx0),
          priceAxis.translate(ly0),
          locked,
          this.chartStyle.handleStyle,
          'move',
        ),
        lineEnd: new RoundHandle(
          timeAxis.translate(lx1),
          priceAxis.translate(ly1),
          locked,
          this.chartStyle.handleStyle,
          'move',
        ),
      };
    } else {
      if (drawing?.handles === undefined) {
        throw new Error('Oops.');
      }

      (drawing.handles.lineStart as RoundHandle).invalidate(
        timeAxis.translate(lx0),
        priceAxis.translate(ly0),
        locked,
      );
      (drawing.handles.lineEnd as RoundHandle).invalidate(
        timeAxis.translate(lx1),
        priceAxis.translate(ly1),
        locked,
      );
    }
  }

  public dragHandle(entry: DataSourceEntry, viewport: Viewport, handle?: HandleId): DragHandle | undefined {
    if (entry === undefined
      || entry.descriptor.options.type !== 'Line'
      || entry.descriptor.options.locked
      || entry.drawing === undefined
    ) {
      console.warn('IllegalState: object can\'t be dragged by this sketcher dragHandle');
      return undefined;
    }

    return (e: DragMoveEvent) => {
      const { dataSource, timeAxis, priceAxis } = viewport;
      const rawDS = toRaw(dataSource);
      const { options, ref } = entry.descriptor;
      let update;

      if (handle === undefined) {
        // todo: still work bad
        const lineScale = (options.data as Line).scale;
        const [x0, y0, x1, y1] = options.data.def;

        let ny0;
        let ny1;

        if (lineScale.title === priceAxis.scale.title) {
          const dy = priceAxis.inverted.value * e.dy;
          ny0 = priceAxis.revert(priceAxis.translate(y0) - dy);
          ny1 = priceAxis.revert(priceAxis.translate(y1) - dy);
        } else if (lineScale.title === PriceScales.regular.title) {
          const priceAtMousePos = priceAxis.inverted.value * priceAxis.revert(e.y) as Price;
          const priceAtOldMousePos = priceAxis.inverted.value * priceAxis.revert(e.y - priceAxis.inverted.value * e.dy) as Price;
          const dy = lineScale.func.translate(priceAtOldMousePos) - lineScale.func.translate(priceAtMousePos);

          console.log({ priceAtMousePos, priceAtOldMousePos, dy });

          ny0 = lineScale.func.revert(lineScale.func.translate(y0) - dy);
          ny1 = lineScale.func.revert(lineScale.func.translate(y1) - dy);
        } else {
          // tbd
          ny0 = y0;
          ny1 = y1;
        }

        const nx0 = timeAxis.revert(timeAxis.translate(x0) - e.dx);
        const nx1 = timeAxis.revert(timeAxis.translate(x1) - e.dx);
        update = { data: { def: [nx0, ny0, nx1, ny1] } };
      }

      if (handle === 'lineStart') {
        const [x0, y0, x1, y1] = options.data.def;
        const nx0 = timeAxis.revert(timeAxis.translate(x0) - e.dx);
        const ny0 = priceAxis.revert(priceAxis.translate(y0) - priceAxis.inverted.value * e.dy);
        update = { data: { def: [nx0, ny0, x1, y1] } };
      }

      if (handle === 'lineEnd') {
        const [x0, y0, x1, y1] = options.data.def;
        const nx1 = timeAxis.revert(timeAxis.translate(x1) - e.dx);
        const ny1 = priceAxis.revert(priceAxis.translate(y1) - priceAxis.inverted.value * e.dy);
        update = { data: { def: [x0, y0, nx1, ny1] } };
      }

      if (update) {
        rawDS.update(ref, update);
      }
    };
  }

  private visiblePoints(line: Line, timeRange: Readonly<Range<UTCTimestamp>>, priceRange: Readonly<Range<Price>>): VisiblePoints {
    const lineScale = line.scale.func;
    const [lx0, ly0, lx1, ly1] = line.def;
    const ldx = lx1 - lx0;
    const ldy = lineScale.translate(ly1) - lineScale.translate(ly0);

    const noVisiblePoints: VisiblePoints = [false, -1 as UTCTimestamp, -1 as Price, -1 as UTCTimestamp, -1 as Price, () => -1 as Price];
    if (ldx === 0) {
      // line is parallel to 0Y
      if (inRange(lx0, timeRange)) {
        return this.applyLineBounds(line, lx0, priceRange.from, lx1, priceRange.to, undefined);
      }

      return noVisiblePoints;
    }

    if (ldy === 0) {
      // line is parallel 0X
      if (inRange(ly0, priceRange)) {
        return this.applyLineBounds(line, timeRange.from, ly0, timeRange.to, ly1, undefined);
      }

      return noVisiblePoints;
    }

    let result: any[] = [];

    const dydx = ldy / ldx;
    const lineFunc = (x: UTCTimestamp) => (line.scale.func.revert(line.scale.func.translate(ly0) + dydx * (x - lx0)));
    const leftSideCross = lineFunc(timeRange.from);
    if (inRange(leftSideCross, priceRange)) {
      result = [...result, timeRange.from, leftSideCross];
    }

    const rightSideCross = lineFunc(timeRange.to);
    if (inRange(rightSideCross, priceRange)) {
      result = [...result, timeRange.to, rightSideCross];
    }

    if (result.length === 4) {
      return this.applyLineBounds(line, result[0], result[1], result[2], result[3], lineFunc);
    }

    const dxdy = ldx / ldy;
    const botSideCross = lx0 + dxdy * (lineScale.translate(priceRange.from) - lineScale.translate(ly0));
    if (inRange(botSideCross, timeRange)) {
      result = [...result, botSideCross, priceRange.from];
    }

    if (result.length === 4) {
      return this.applyLineBounds(line, result[0], result[1], result[2], result[3], lineFunc);
    }

    const topSideCross = lx0 + dxdy * (lineScale.translate(priceRange.to) - lineScale.translate(ly0));
    if (inRange(topSideCross, timeRange)) {
      result = [...result, topSideCross, priceRange.to];
    }

    if (result.length === 4) {
      return this.applyLineBounds(line, result[0], result[1], result[2], result[3], lineFunc);
    }

    return noVisiblePoints;
  }

  private applyLineBounds(
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
        lx0 + p0[0] as UTCTimestamp,
        ly0 + p0[1] as Price,
        lx0 + p1[0] as UTCTimestamp,
        ly0 + p1[1] as Price,
        lineFunc,
      ];
    }

    return [false, -1 as UTCTimestamp, -1 as Price, -1 as UTCTimestamp, -1 as Price, () => -1 as Price];
  }
}
