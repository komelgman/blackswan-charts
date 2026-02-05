import { describe, expect, it } from 'vitest';
import { PriceAxis } from '@/model/chart/axis/PriceAxis';
import { ControlMode } from '@/model/chart/axis/types';
import { HistoricalTransactionManager, History } from '@/model/history';
import { IdHelper } from '@/model/misc/tools';
import darkTheme from '@/model/default-config/ChartStyle.Dark.Defaults';
import type { Price, Range } from '@/model/chart/types';

function createPriceAxis() {
  const history = new History();
  const idHelper = new IdHelper();
  const manager = new HistoricalTransactionManager(idHelper, history);
  const axis = new PriceAxis('price', manager, darkTheme.textStyle, 0);

  return { axis, history };
}

describe('PriceAxis math', () => {
  it('translate/revert round trip for both inverted states', () => {
    const { axis } = createPriceAxis();
    axis.noHistoryManagedUpdate({
      range: { from: 0, to: 100 } as Range<Price>,
      screenSize: { main: 100, second: 0 },
      inverted: false,
      scale: 'regular',
    });

    const value = 25 as Price;
    const screen = axis.translate(value);
    expect(axis.revert(screen)).toBeCloseTo(value);

    axis.noHistoryManagedUpdate({ inverted: true });

    const screenInverted = axis.translate(value);
    expect(axis.revert(screenInverted)).toBeCloseTo(value);
  });

  it('invert is undoable', () => {
    const { axis, history } = createPriceAxis();
    axis.noHistoryManagedUpdate({
      range: { from: 0, to: 100 } as Range<Price>,
      screenSize: { main: 100, second: 0 },
      inverted: false,
      scale: 'regular',
    });

    axis.invert();
    expect(axis.inverted.value).toBe(1);

    history.undo();
    expect(axis.inverted.value).toBe(-1);
  });

  it('scale change is undoable', () => {
    const { axis, history } = createPriceAxis();
    axis.noHistoryManagedUpdate({
      range: { from: 1, to: 100 } as Range<Price>,
      screenSize: { main: 100, second: 0 },
      inverted: true,
      scale: 'regular',
    });

    axis.scale = 'log10';
    expect(axis.scale.id).toBe('log10');

    history.undo();
    expect(axis.scale.id).toBe('regular');
  });

  it('zoom updates range and is undoable', () => {
    const { axis, history } = createPriceAxis();
    axis.noHistoryManagedUpdate({
      range: { from: 0, to: 100 } as Range<Price>,
      screenSize: { main: 100, second: 0 },
      inverted: false,
      scale: 'regular',
    });

    axis.controlMode = ControlMode.AUTO;
    const before = { ...axis.range } as Range<Price>;

    axis.zoom(axis.screenSize.main / 2, -10);

    const afterZoom = { ...axis.range } as Range<Price>;
    expect(afterZoom).not.toEqual(before);
    expect(axis.controlMode.value).toBe(ControlMode.MANUAL);

    history.undo(); // undo zoom
    expect(axis.range.from).toBeCloseTo(before.from);
    expect(axis.range.to).toBeCloseTo(before.to);
    expect(axis.controlMode.value).toBe(ControlMode.AUTO);
  });

  it('move updates range and is undoable', () => {
    const { axis, history } = createPriceAxis();
    axis.noHistoryManagedUpdate({
      range: { from: 0, to: 100 } as Range<Price>,
      screenSize: { main: 100, second: 0 },
      inverted: false,
      scale: 'regular',
    });

    const before = { ...axis.range } as Range<Price>;

    axis.move(10);

    expect(axis.range).not.toEqual(before);

    history.undo();
    expect(axis.range).toEqual(before);
  });
});
