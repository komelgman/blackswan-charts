import { AbstractSketcher } from '@/model/chart/viewport/sketchers/AbstractSketcher';
import { projectLine } from '@/model/chart/drawing/line-projection';
import { updateLineGraphics } from '@/model/chart/viewport/sketchers/graphics/updateLineGraphics';
import RoundHandle from '@/model/chart/viewport/sketchers/handles/RoundHandle';
import type { DrawingProjection } from '@/model/chart/drawing/DrawingProjection';
import type { DataSourceEntry } from '@/model/datasource/types';
import type { Line, UTCTimestamp, Price } from '@/model/chart/types';

export class LineSketcher extends AbstractSketcher<Line> {
  protected draw(entry: DataSourceEntry<Line>, projection: DrawingProjection): void {
    if (!this.chartStyle) throw new Error('LineSketcher requires a chart style');
    const { data: line, locked } = entry.descriptor.options;
    const geometry = projectLine(line, projection);
    entry.descriptor.visibleInViewport = !!geometry;
    entry.descriptor.valid = !!geometry;
    if (!geometry) return;
    const drawing = (entry.drawing ??= { parts: [], handles: {} });
    drawing.parts[0] = updateLineGraphics(drawing.parts[0], geometry, line.style);
    const { timeAxis, priceAxis } = projection;
    for (const [id, offset] of [
      ['lineStart', 0],
      ['lineEnd', 2],
    ] as const) {
      const x = timeAxis.translate(line.def[offset] as UTCTimestamp);
      const y = priceAxis.translate(line.def[offset + 1] as Price);
      const handle = drawing.handles[id] as RoundHandle | undefined;
      if (handle) handle.invalidate(x, y, locked);
      else drawing.handles[id] = new RoundHandle(x, y, locked, this.chartStyle.handleStyle, 'move');
    }
  }
}
