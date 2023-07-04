import { toRaw } from 'vue';
import type { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import type { DragMoveEvent } from '@/components/layered-canvas/LayeredCanvas.vue';
import { inRange } from '@/misc/line-functions';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { HandleId } from '@/model/datasource/Drawing';
import AbstractSketcher from '@/model/sketchers/AbstractSketcher';
import LineGraphics from '@/model/sketchers/graphics/LineGraphics';
import RoundHandle from '@/model/sketchers/graphics/RoundHandle';
import type { Line, LineStyle, Price, Range, UTCTimestamp } from '@/model/type-defs';
import { LineBound } from '@/model/type-defs';
import type { DragHandle } from '@/model/viewport/DragHandle';
import type Viewport from '@/model/viewport/Viewport';

export interface LineOptions {
  def: UTCTimestamp;
  style: LineStyle;
}

export declare type VisiblePoints = [boolean, UTCTimestamp, Price, UTCTimestamp, Price];
declare type VisiblePoint = [UTCTimestamp, Price, 'Side' | 'StartBound' | 'EndBound'];

export default class LineSketcher extends AbstractSketcher {
  public draw(entry: DataSourceEntry<Line>, viewport: Viewport): void {
    if (this.chartStyle === undefined) {
      throw new Error('Illegal state: this.chartStyle === undefined');
    }

    const [descriptor, drawing] = entry;

    const { data: line, locked } = descriptor.options;
    const { timeAxis, priceAxis } = viewport;
    const { range: priceRange, scale: priceScale } = priceAxis;
    const { range: timeRange } = timeAxis;
    const [visible, x0, y0, x1, y1] = this.visiblePoints(line, timeRange, priceRange);

    descriptor.visibleInViewport = visible;
    descriptor.valid = descriptor.visibleInViewport;

    if (!descriptor.visibleInViewport) {
      return;
    }

    if (priceScale.title === line.scale.title) {
      // draw straight line
      const vpX0 = timeAxis.translate(x0);
      const vpY0 = priceAxis.translate(y0);
      const vpX1 = timeAxis.translate(x1);
      const vpY1 = priceAxis.translate(y1);

      if (drawing === undefined) {
        entry[1] = {
          parts: [new LineGraphics(vpX0, vpY0, vpX1, vpY1, line.style)],
          handles: {
            lineStart: new RoundHandle(
              timeAxis.translate(line.def[0]),
              priceAxis.translate(line.def[1]),
              locked,
              this.chartStyle.handleStyle,
              'move',
            ),
            lineEnd: new RoundHandle(
              timeAxis.translate(line.def[2]),
              priceAxis.translate(line.def[3]),
              locked,
              this.chartStyle.handleStyle,
              'move',
            ),
          },
        };
      } else {
        (drawing.parts[0] as LineGraphics).invalidate({
          x0: vpX0,
          y0: vpY0,
          x1: vpX1,
          y1: vpY1,
          lineStyle: line.style,
        });
        (drawing.handles.lineStart as RoundHandle).invalidate(
          timeAxis.translate(line.def[0]),
          priceAxis.translate(line.def[1]),
          locked,
        );
        (drawing.handles.lineEnd as RoundHandle).invalidate(
          timeAxis.translate(line.def[2]),
          priceAxis.translate(line.def[3]),
          locked,
        );
      }
    } else {
      // draw spline
      throw new Error('Oops');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public dragHandle(viewport: Viewport, entry: DataSourceEntry, handle?: HandleId): DragHandle | undefined {
    if (entry === undefined
      || entry[0].options.type !== 'Line'
      || entry[0].options.locked
      || entry[1] === undefined
    ) {
      console.warn('IllegalState: highlighted object doesn\'t fit tho this sketcher dragHandle');
      return undefined;
    }

    return (e: DragMoveEvent) => {
      const { dataSource, timeAxis, priceAxis } = viewport;
      const rawDS = toRaw(dataSource);
      const { options, ref } = entry[0];
      let update;

      if (handle === undefined) {
        const [x0, y0, x1, y1] = options.data.def;
        const nx0 = timeAxis.revert(timeAxis.translate(x0) - e.dx);
        const ny0 = priceAxis.revert(priceAxis.translate(y0) - priceAxis.inverted.value * e.dy);
        const nx1 = timeAxis.revert(timeAxis.translate(x1) - e.dx);
        const ny1 = priceAxis.revert(priceAxis.translate(y1) - priceAxis.inverted.value * e.dy);
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public contextmenu(dataSourceEntry: DataSourceEntry): MenuItem[] {
    return [];
  }

  private visiblePoints(
    line: Line,
    timeRange: Readonly<Range<UTCTimestamp>>,
    priceRange: Readonly<Range<Price>>,
  ): VisiblePoints {
    const [lx0, ly0, lx1, ly1] = line.def;
    const ldx = lx1 - lx0;
    const ldy = ly1 - ly0;

    if (ldx === 0) {
      // line is parallel to 0Y
      if (inRange(lx0, timeRange)) {
        return this.applyLineBounds(line, lx0, priceRange.from, lx1, priceRange.to);
      }

      return [false, -1 as UTCTimestamp, -1 as Price, -1 as UTCTimestamp, -1 as Price];
    }

    if (ldy === 0) {
      // line is parallel 0X
      if (inRange(ly0, priceRange)) {
        return this.applyLineBounds(line, timeRange.from, ly0, timeRange.to, ly1);
      }

      return [false, -1 as UTCTimestamp, -1 as Price, -1 as UTCTimestamp, -1 as Price];
    }

    let result: any[] = [];

    const dydx = ldy / ldx;
    const leftSideCross = ly0 + dydx * (timeRange.from - lx0);
    if (inRange(leftSideCross, priceRange)) {
      result = [...result, timeRange.from, leftSideCross];
    }

    const rightSideCross = ly0 + dydx * (timeRange.to - lx0);
    if (inRange(rightSideCross, priceRange)) {
      result = [...result, timeRange.to, rightSideCross];
    }

    if (result.length === 4) {
      return this.applyLineBounds(line, result[0], result[1], result[2], result[3]);
    }

    const dxdy = ldx / ldy;
    const botSideCross = lx0 + dxdy * (priceRange.from - ly0);
    if (inRange(botSideCross, timeRange)) {
      result = [...result, botSideCross, priceRange.from];
    }

    if (result.length === 4) {
      return this.applyLineBounds(line, result[0], result[1], result[2], result[3]);
    }

    const topSideCross = lx0 + dxdy * (priceRange.to - ly0);
    if (inRange(topSideCross, timeRange)) {
      result = [...result, topSideCross, priceRange.to];
    }

    if (result.length === 4) {
      return this.applyLineBounds(line, result[0], result[1], result[2], result[3]);
    }

    return [false, -1 as UTCTimestamp, -1 as Price, -1 as UTCTimestamp, -1 as Price];
  }

  private applyLineBounds(line: Line, x0: UTCTimestamp, y0: Price, x1: UTCTimestamp, y1: Price): VisiblePoints {
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
      return [true, lx0 + p0[0] as UTCTimestamp, ly0 + p0[1] as Price, lx0 + p1[0] as UTCTimestamp, ly0 + p1[1] as Price];
    }

    return [false, -1 as UTCTimestamp, -1 as Price, -1 as UTCTimestamp, -1 as Price];
  }
}
