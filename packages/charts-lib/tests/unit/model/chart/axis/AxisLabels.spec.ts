import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { PriceAxis } from '@/model/chart/axis/PriceAxis';
import TimeAxis from '@/model/chart/axis/TimeAxis';
import PriceLabelsInvalidator from '@/model/chart/axis/label/PriceLabelsInvalidator';
import TimeLabelsInvalidator from '@/model/chart/axis/label/TimeLabelsInvalidator';
import { HistoricalTransactionManager, History } from '@/model/history';
import { IdHelper } from '@blackswan/foundation';
import darkTheme from '@/model/default-config/ChartStyle.Dark.Defaults';
import type { LayerContext } from '@blackswan/layered-canvas/model';
import type { Price, Range, UTCTimestamp } from '@/model/chart/types';

function createPriceAxis() {
  const history = new History();
  const idHelper = new IdHelper();
  const manager = new HistoricalTransactionManager(idHelper, history);
  const axis = new PriceAxis('price', manager, darkTheme.textStyle, 0);

  return axis;
}

function createTimeAxis() {
  const history = new History();
  const idHelper = new IdHelper();
  const manager = new HistoricalTransactionManager(idHelper, history);
  const axis = new TimeAxis(manager, darkTheme.textStyle);

  return axis;
}

function createLayerContext(): LayerContext {
  return {
    mainCanvas: {} as HTMLCanvasElement,
    utilityCanvasContext: {
      save: vi.fn(),
      restore: vi.fn(),
      measureText: (text: string) => ({ width: text.length * 6 }),
    } as unknown as CanvasRenderingContext2D,
    width: 300,
    height: 200,
    dpr: 1,
  };
}

describe('Axis labels invalidators', () => {
  it('PriceLabelsInvalidator updates labels and content width', () => {
    const axis = createPriceAxis();
    axis.noHistoryManagedUpdate({
      range: { from: 1, to: 100 } as Range<Price>,
      screenSize: { main: 200, second: 0 },
      inverted: false,
      scale: 'regular',
      contentWidth: 0,
    });

    const invalidator = new PriceLabelsInvalidator(axis);
    invalidator.context = createLayerContext();

    invalidator.invalidate();

    expect(axis.labels.value.length).toBeGreaterThan(0);
    expect(axis.contentWidth.value).toBeGreaterThan(0);
  });

  it('PriceLabelsInvalidator reacts to range changes', async () => {
    const axis = createPriceAxis();
    axis.noHistoryManagedUpdate({
      range: { from: 1, to: 10 } as Range<Price>,
      screenSize: { main: 200, second: 0 },
      inverted: false,
      scale: 'regular',
      contentWidth: 0,
    });

    const invalidator = new PriceLabelsInvalidator(axis);
    invalidator.context = createLayerContext();
    const beforeLabels = axis.labels.value;

    axis.noHistoryManagedUpdate({
      range: { from: 1, to: 20 } as Range<Price>,
    });

    await nextTick();

    expect(axis.labels.value).not.toBe(beforeLabels);
  });

  it('TimeLabelsInvalidator builds ordered labels within screen range', () => {
    const axis = createTimeAxis();
    axis.noHistoryManagedUpdate({
      range: { from: 0, to: (60 * 60 * 1000) } as Range<UTCTimestamp>,
      screenSize: { main: 600, second: 0 },
    });

    const invalidator = new TimeLabelsInvalidator(axis);
    invalidator.invalidate();

    const labels = axis.labels.value;
    expect(labels.length).toBeGreaterThan(0);

    for (let i = 1; i < labels.length; i++) {
      expect(labels[i][0]).toBeGreaterThanOrEqual(labels[i - 1][0]);
    }

    const hasVisibleLabel = labels.some(([pos]) => pos >= 0 && pos <= axis.screenSize.main);
    expect(hasVisibleLabel).toBe(true);
  });
});
