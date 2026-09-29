import { describe, expect, it } from 'vitest';
import { PriceAxis } from '@/model/chart/axis/PriceAxis';
import { ControlMode } from '@/model/chart/axis/types';
import { HistoricalTransactionManager, History } from '@/model/history';
import { IdHelper } from '@blackswan/foundation';
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
  it('preserves endpoints when the inverse multiplier underflows', () => {
    const { axis } = createPriceAxis();
    axis.noHistoryManagedUpdate({ scale: 'regular', inverted: true,
      range: { from: 0 as Price, to: 1e-322 as Price }, screenSize: { main: 2000, second: 0 } });
    expect(axis.revert(0)).toBe(0);
    expect(axis.revert(2000)).toBe(1e-322);
    expect(axis.translate(1e-322 as Price)).toBe(2000);
  });

  it.each(['regular', 'log10', 'percentage'].flatMap(scale => [false, true].flatMap(inverted =>
    [[0, 100], [1e-298, 1.0000001e-298], [1e300, 2e300]].map(([from, to]) => ({ scale, inverted, from, to })),
  )))('projects, shifts and pads extreme ranges: $scale inverted=$inverted $from … $to', ({ scale, inverted, from, to }) => {
    const { axis } = createPriceAxis();
    axis.noHistoryManagedUpdate({ scale, inverted, range: { from: from as Price, to: to as Price },
      screenSize: { main: 2000, second: 0 } });
    const price = axis.revert(500);
    expect(Math.abs(axis.translate(price) - 500)).toBeLessThan(0.001);
    const batch = [[price]];
    axis.translateBatchInPlace(batch, [0]);
    expect(batch[0][0]).toBe(axis.translate(price));
    expect(Math.abs(axis.translate(axis.scaledShift(price, 0.1)) - 700)).toBeLessThan(0.001);
    const padded = axis.applyPaddingToRange(axis.range, -0.1, 0.1);
    expect(Math.abs(axis.translate(padded.from) - (inverted ? -250 : 2250))).toBeLessThan(0.001);
    expect(Math.abs(axis.translate(padded.to) - (inverted ? 2250 : -250))).toBeLessThan(0.001);
  });

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
