import { ChannelSketcher } from '@/model/chart/viewport/sketchers/ChannelSketcher';
import { RecordingPath } from '@tests/support/RecordingCanvas';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DragMoveEvent, MouseClickEvent } from '@blackswan/layered-canvas/model';
import { createChartHarness } from '@tests/support/chartHarness';
import { PriceScales } from '@/model/chart/axis/scaling/PriceAxisScale';
import { LineBound, type Line, type Price, type UTCTimestamp } from '@/model/chart/types';
import { channelBoundary, linePriceAt, moveChannel, type Channel } from '@/model/chart/drawing/channel';
import { ChartSerializer } from '@/model/chart/serialization/ChartSerializer';
import { ChartDeserializer } from '@/model/chart/serialization/ChartDesializer';
import { moveLine } from '@/model/chart/drawing/line-behaviors';

let harness: ReturnType<typeof createChartHarness>;
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('Path2D', RecordingPath);
});
afterEach(() => {
  harness?.dispose();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
function setup(render = false, axis = 'regular', drawingScale = 'regular') {
  harness = createChartHarness({ render });
  const data: Channel = {
    def: [-0.5, 100, 0.5, 200] as Line['def'],
    offset: drawingScale === 'regular' ? 60 : 0.2,
    scale: PriceScales[drawingScale],
    boundType: LineBound.Both,
    style: { color: '#dba', lineWidth: 2, fill: 0 },
  };
  const source = harness.addPane('main', undefined, [{ id: 'Channel1', type: 'Channel', locked: false, visible: true, data }]);
  const viewport = harness.chart.paneModel('main');
  viewport.priceAxis.noHistoryManagedUpdate({ scale: axis, range: { from: 10 as Price, to: 1000 as Price } });
  harness.chart.clearHistory();
  return { source, viewport, data };
}

describe('drawing behavior without a renderer', () => {
  it.each(
    ['regular', 'log10'].flatMap((axis) =>
      ['regular', 'log10'].flatMap((scale) =>
        [false, true].flatMap((inverted) => [false, true].map((upper) => ({ axis, scale, inverted, upper }))),
      ),
    ),
  )(
    'moves either channel boundary and restores history: $axis/$scale/$inverted/$upper',
    async ({ axis, scale, inverted, upper }) => {
      const { source, viewport, data } = setup(false, axis, scale);
      viewport.priceAxis.noHistoryManagedUpdate({ inverted });
      await harness.settle();
      const entry = source.get<Channel>('Channel1');
      expect(entry.drawing).toBeUndefined();
      const anchor = linePriceAt(upper ? channelBoundary(data) : data, 0 as UTCTimestamp);
      const x = viewport.timeAxis.translate(0 as UTCTimestamp),
        y = viewport.priceAxis.translate(anchor);
      viewport.highlighted = entry;
      viewport.startDragging({ isCtrlPressed: false } as MouseClickEvent);
      viewport.drag({ x: x + 20, y: y - 15, dx: -20, dy: 15 } as DragMoveEvent);
      viewport.endDragging();
      const moved = structuredClone({ def: entry.descriptor.options.data.def, offset: entry.descriptor.options.data.offset });
      const boundary = upper ? channelBoundary(entry.descriptor.options.data) : entry.descriptor.options.data;
      const price = linePriceAt(boundary, viewport.timeAxis.revert(x + 20));
      expect(viewport.priceAxis.translate(price)).toBeCloseTo(y - 15, 7);
      expect(moved.offset).toBe(data.offset);
      harness.chart.undo();
      expect(entry.descriptor.options.data.def).toEqual(data.def);
      harness.chart.redo();
      expect(entry.descriptor.options.data.def).toEqual(moved.def);
    },
  );

  it('registers a new drawing name without teaching the viewport or history about it', async () => {
    harness = createChartHarness({
      sketchers: new Map([['ParallelBand', new ChannelSketcher()]]),
      drawingBehaviors: new Map([['ParallelBand', moveChannel]]),
    });
    const source = harness.addPane('main', undefined, [
      {
        id: 'ParallelBand1',
        type: 'ParallelBand',
        locked: false,
        visible: true,
        data: {
          def: [-0.5, -0.5, 0.5, 0.5],
          offset: 0.25,
          scale: PriceScales.regular,
          boundType: LineBound.Both,
          style: { color: '#acb', lineWidth: 2, fill: 0 },
        },
      },
    ]);
    await harness.settle();
    harness.chart.clearHistory();
    const entry = source.get<Channel>('ParallelBand1');
    const initial = entry.descriptor.options.data.def.slice();
    harness.drag(harness.chart.paneModel('main'), 'ParallelBand1', -20, -10);
    expect(entry.descriptor.options.data.def).not.toEqual(initial);
    harness.chart.undo();
    expect(entry.descriptor.options.data.def).toEqual(initial);
    harness.chart.redo();
    expect(entry.descriptor.options.data.def).not.toEqual(initial);
  });

  it.each(['lineStart', 'lineEnd', 'channelWidth'])('edits a channel handle and restores all data: %s', async (handle) => {
    const { source, viewport, data } = setup();
    await harness.settle();
    const initial = JSON.stringify(data);
    const entry = source.get<Channel>('Channel1');
    viewport.highlighted = entry;
    viewport.highlightedHandleId = handle;
    viewport.startDragging({ isCtrlPressed: false } as MouseClickEvent);
    viewport.drag({ x: 420, y: 300, dx: -20, dy: 10 } as DragMoveEvent);
    viewport.endDragging();
    expect(JSON.stringify(entry.descriptor.options.data)).not.toBe(initial);
    if (handle === 'channelWidth') expect(entry.descriptor.options.data.def).toEqual(data.def);
    else expect(entry.descriptor.options.data.offset).toBe(data.offset);
    harness.chart.undo();
    expect(JSON.stringify(entry.descriptor.options.data)).toBe(initial);
  });

  it('changes width without mutating the input and ignores unknown handles', async () => {
    const { viewport, data } = setup();
    await harness.settle();
    const before = JSON.stringify(data);
    const y = viewport.priceAxis.translate(linePriceAt(channelBoundary(data), 0 as UTCTimestamp));
    const event = { x: 400, y: y - 10, dx: 0, dy: 10 };
    const patch = moveChannel(data, viewport.projection, event, 'channelWidth');
    expect(patch?.offset).toBeGreaterThan(data.offset);
    expect(JSON.stringify(data)).toBe(before);
    expect(moveChannel(data, viewport.projection, event, 'unknown')).toBeUndefined();
    expect(moveLine(data, viewport.projection, event, 'unknown')).toBeUndefined();
    expect(viewport.projection).not.toHaveProperty('dataSource');
    expect(viewport.projection.priceAxis).not.toHaveProperty('move');
  });

  it('keeps both boundaries and three handles after JSON restore', async () => {
    const { source, data } = setup(true);
    await harness.settle();
    expect(source.get('Channel1').drawing?.parts).toHaveLength(2);
    expect(Object.keys(source.get('Channel1').drawing!.handles)).toHaveLength(3);
    const serialized = JSON.parse(JSON.stringify(new ChartSerializer().serialize(harness.chart)));
    new ChartDeserializer().deserialize(harness.chart, serialized);
    await harness.settle();
    const restored = harness.chart.paneModel('main').dataSource.get<Channel>('Channel1');
    expect(restored.descriptor.options.data.scale.id).toBe('regular');
    expect(restored.descriptor.options.data.scale.func.translate(10 as Price)).toBe(10);
    expect(restored.descriptor.options.data.def).toEqual(data.def);
    expect(restored.descriptor.options.data.offset).toBe(data.offset);
    expect(restored.drawing?.parts).toHaveLength(2);
  });
});
