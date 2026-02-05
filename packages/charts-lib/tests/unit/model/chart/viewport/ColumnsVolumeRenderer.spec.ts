import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { DataSourceEntry } from '@/model/datasource/types';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import type { OHLCvBar, OHLCv, Price, UTCTimestamp } from '@/model/chart/types';
import { TimePeriods } from '@/model/chart/types/time';
import { DEFAULT_VOLUME_INDICATOR_HEIGHT_FACTOR } from '@/model/chart/viewport/sketchers';
import type { ColumnsVolumeIndicator } from '@/model/chart/viewport/sketchers/renderers/ColumnsVolumeRenderer';
import { ColumnsVolumeRenderer } from '@/model/chart/viewport/sketchers/renderers/ColumnsVolumeRenderer';

type PathCommand = { cmd: 'moveTo' | 'lineTo'; x: number; y: number };

class MockPath2D {
  public commands: PathCommand[] = [];

  public moveTo(x: number, y: number): void {
    this.commands.push({ cmd: 'moveTo', x, y });
  }

  public lineTo(x: number, y: number): void {
    this.commands.push({ cmd: 'lineTo', x, y });
  }
}

const originalPath2D = (globalThis as { Path2D?: typeof Path2D }).Path2D;

beforeAll(() => {
  (globalThis as { Path2D?: typeof Path2D }).Path2D = MockPath2D as unknown as typeof Path2D;
});

afterAll(() => {
  (globalThis as { Path2D?: typeof Path2D }).Path2D = originalPath2D;
});

function createViewport(inverted: boolean, screenHeight: number): Viewport {
  const translate = (value: number) => value;
  const timeAxis = {
    range: { from: 0 as UTCTimestamp, to: 100 as UTCTimestamp },
    translate,
    translateBatchInPlace(values: any[][], indices: number[]) {
      for (let i = 0; i < values.length; i++) {
        const v = values[i];
        for (let j = 0; j < indices.length; j++) {
          const index = indices[j];
          v[index] = translate(v[index] as number);
        }
      }
    },
  };

  const priceAxis = {
    screenSize: { main: screenHeight, second: 0 },
    inverted: { value: inverted ? 1 : -1 },
  };

  return { priceAxis, timeAxis } as unknown as Viewport;
}

function createEntry(heightFactor?: number): DataSourceEntry<ColumnsVolumeIndicator> {
  const content: OHLCv = {
    loaded: { from: 0 as UTCTimestamp, to: 1 as UTCTimestamp },
    available: { from: 0 as UTCTimestamp, to: 1 as UTCTimestamp },
    step: TimePeriods.h1,
    values: [],
  };

  const plotOptions = {
    type: 'VolumeIndicator',
    style: {
      type: 'Columns',
      bearish: { body: '#f00', border: '#f00' },
      bullish: { body: '#0f0', border: '#0f0' },
    },
  };

  if (heightFactor !== undefined) {
    Object.assign(plotOptions, { heightFactor });
  }

  return {
    descriptor: {
      ref: 'volume' as const,
      options: {
        id: 'volume',
        type: 'VolumeIndicator',
        locked: false,
        visible: true,
        data: {
          content,
          plotOptions,
        },
      },
    },
    drawing: { parts: [], handles: {}, renderer: '' },
  };
}

function getFirstLine(entry: DataSourceEntry<ColumnsVolumeIndicator>): { y0: number; y1: number } {
  const parts = entry.drawing?.parts || [];
  const bullish = parts[1] as any;
  const path = bullish.columnPath as MockPath2D;
  const [move, line] = path.commands;
  return { y0: move.y, y1: line.y };
}

describe('ColumnsVolumeRenderer', () => {
  const bars: OHLCvBar[] = [[1 as UTCTimestamp, 1 as Price, 1 as Price, 1 as Price, 2 as Price, 10]];
  let renderer: ColumnsVolumeRenderer;

  beforeEach(() => {
    renderer = new ColumnsVolumeRenderer();
  });

  it.each([
    {
      name: 'draws volume from bottom when not inverted',
      inverted: false,
      screenHeight: 100,
      heightFactor: undefined,
      expectedBase: 100,
      expectedHeight: DEFAULT_VOLUME_INDICATOR_HEIGHT_FACTOR * 100,
    },
    {
      name: 'draws volume from top when inverted',
      inverted: true,
      screenHeight: 100,
      heightFactor: undefined,
      expectedBase: 0,
      expectedHeight: DEFAULT_VOLUME_INDICATOR_HEIGHT_FACTOR * 100,
    },
    {
      name: 'respects custom heightFactor',
      inverted: false,
      screenHeight: 120,
      heightFactor: 0.5,
      expectedBase: 120,
      expectedHeight: 0.5 * 120,
    },
  ])('$name', ({ inverted, screenHeight, heightFactor, expectedBase, expectedHeight }) => {
    const viewport = createViewport(inverted, screenHeight);
    const entry = createEntry(heightFactor);
    renderer.renderBarsToEntry(bars, entry, viewport);

    const { y0, y1 } = getFirstLine(entry);
    const expectedEnd = inverted ? expectedHeight : expectedBase - expectedHeight;

    expect(y0).toBeCloseTo(expectedBase);
    expect(y1).toBeCloseTo(expectedEnd);
  });
});
