import { AbstractSketcher } from '@/model/chart/viewport/sketchers/AbstractSketcher';
import { projectLine } from '@/model/chart/drawing/line-projection';
import { channelBoundary, linePriceAt, type Channel } from '@/model/chart/drawing/channel';
import { updateLineGraphics } from '@/model/chart/viewport/sketchers/graphics/updateLineGraphics';
import RoundHandle from '@/model/chart/viewport/sketchers/handles/RoundHandle';
import type { DrawingProjection } from '@/model/chart/drawing/DrawingProjection';
import type { DataSourceEntry } from '@/model/datasource/types';
import type { UTCTimestamp, Price } from '@/model/chart/types';

export class ChannelSketcher extends AbstractSketcher<Channel> {
  protected draw(entry: DataSourceEntry<Channel>, projection: DrawingProjection): void {
    if (!this.chartStyle) throw new Error('ChannelSketcher requires a chart style');
    const { data, locked } = entry.descriptor.options;
    const upper = channelBoundary(data);
    const geometries = [projectLine(data, projection), projectLine(upper, projection)];
    entry.descriptor.visibleInViewport = geometries.some(Boolean);
    entry.descriptor.valid = true;
    if (!entry.descriptor.visibleInViewport) return;
    const drawing = (entry.drawing ??= { parts: [], handles: {} });
    const parts = drawing.parts;
    let count = 0;
    for (const geometry of geometries) {
      if (geometry) {
        parts[count] = updateLineGraphics(parts[count], geometry, data.style);
        count++;
      }
    }
    parts.length = count;
    const x = ((data.def[0] + data.def[2]) / 2) as UTCTimestamp;
    const handles: [string, UTCTimestamp, Price][] = [
      ['lineStart', data.def[0], data.def[1]],
      ['lineEnd', data.def[2], data.def[3]],
      ['channelWidth', x, linePriceAt(upper, x)],
    ];
    for (const [id, time, price] of handles) {
      const px = projection.timeAxis.translate(time),
        py = projection.priceAxis.translate(price);
      const handle = drawing.handles[id] as RoundHandle | undefined;
      if (handle) handle.invalidate(px, py, locked);
      else
        drawing.handles[id] = new RoundHandle(
          px,
          py,
          locked,
          this.chartStyle.handleStyle,
          id === 'channelWidth' ? 'ns-resize' : 'move',
        );
    }
  }
}
