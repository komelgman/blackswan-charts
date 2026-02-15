import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { DataSourceEntry } from '@/model/datasource/types';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import type { OHLCv, OHLCvBar, Price, UTCTimestamp } from '@/model/chart/types';
import { TimePeriods } from '@/model/chart/types/time';
import {
  CandlestickPlotRenderer,
  type CandlestickPlot,
} from '@/model/chart/viewport/sketchers/renderers/CandlestickPlotRenderer';

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
  (globalThis as { Path2D?: typeof Path2D }).Path2D =
    MockPath2D as unknown as typeof Path2D;
});

afterAll(() => {
  (globalThis as { Path2D?: typeof Path2D }).Path2D = originalPath2D;
});

function createViewport(
  inverted: boolean,
  screenHeight: number = 100,
): Viewport {
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
  } as {
    screenSize: { main: number; second: number };
    inverted: { value: 1 | -1 };
    translateBatchInPlace: (values: any[][], indices: number[]) => void;
  };

  priceAxis.translateBatchInPlace = (values: any[][], indices: number[]) => {
    const invertedAxis = priceAxis.inverted.value < 0;
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      for (let j = 0; j < indices.length; j++) {
        const index = indices[j];
        const translated = v[index] as number;
        v[index] = invertedAxis ? screenHeight - translated : translated;
      }
    }
  };

  return { priceAxis, timeAxis } as unknown as Viewport;
}

function createEntry(): DataSourceEntry<CandlestickPlot> {
  const content: OHLCv = {
    loaded: { from: 0 as UTCTimestamp, to: 1 as UTCTimestamp },
    available: { from: 0 as UTCTimestamp, to: 1 as UTCTimestamp },
    step: TimePeriods.h1,
    values: [],
  };

  const plotOptions = {
    type: 'CandlestickPlot',
    barStyle: {
      showBody: true,
      showBorder: true,
      showWick: true,
      bearish: { wick: '#f00', body: '#f00', border: '#f00' },
      bullish: { wick: '#0f0', body: '#0f0', border: '#0f0' },
    },
  };

  return {
    descriptor: {
      ref: 'candles' as const,
      options: {
        id: 'candles',
        type: 'CandlestickPlot',
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

function getBarCommandCount(
  entry: DataSourceEntry<CandlestickPlot>,
  index: number,
): number {
  const part = entry.drawing?.parts?.[index] as
    | { barPath?: MockPath2D }
    | undefined;
  return part?.barPath?.commands?.length ?? 0;
}

describe('CandlestickPlotRenderer', () => {
  it.each([
    { name: 'not inverted', inverted: false },
    { name: 'inverted', inverted: true },
  ])('uses bullish style for open < close when axis is $name', ({ inverted }) => {
    const renderer = new CandlestickPlotRenderer();
    const viewport = createViewport(inverted);
    const entry = createEntry();
    const bars: OHLCvBar[] = [
      [1 as UTCTimestamp, 10 as Price, 12 as Price, 8 as Price, 11 as Price, 0],
    ];

    renderer.renderBarsToEntry(bars, entry, viewport);

    const bearishCommands = getBarCommandCount(entry, 0);
    const bullishCommands = getBarCommandCount(entry, 1);

    expect(bullishCommands).toBeGreaterThan(0);
    expect(bearishCommands).toBe(0);
  });

  it.each([
    { name: 'not inverted', inverted: false },
    { name: 'inverted', inverted: true },
  ])('uses bearish style for open > close when axis is $name', ({ inverted }) => {
    const renderer = new CandlestickPlotRenderer();
    const viewport = createViewport(inverted);
    const entry = createEntry();
    const bars: OHLCvBar[] = [
      [1 as UTCTimestamp, 11 as Price, 12 as Price, 8 as Price, 10 as Price, 0],
    ];

    renderer.renderBarsToEntry(bars, entry, viewport);

    const bearishCommands = getBarCommandCount(entry, 0);
    const bullishCommands = getBarCommandCount(entry, 1);

    expect(bearishCommands).toBeGreaterThan(0);
    expect(bullishCommands).toBe(0);
  });
});
