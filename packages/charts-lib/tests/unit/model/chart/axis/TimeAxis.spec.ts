import { describe, expect, it } from 'vitest';
import TimeAxis from '@/model/chart/axis/TimeAxis';
import { ControlMode } from '@/model/chart/axis/types';
import { HistoricalTransactionManager, History } from '@/model/history';
import { IdHelper } from '@blackswan/foundation';
import darkTheme from '@/model/default-config/ChartStyle.Dark.Defaults';
import type { Range, UTCTimestamp } from '@/model/chart/types';

function createTimeAxis() {
  const history = new History();
  const idHelper = new IdHelper();
  const manager = new HistoricalTransactionManager(idHelper, history);
  const axis = new TimeAxis(manager, darkTheme.textStyle);

  return { axis, history };
}

describe('TimeAxis math', () => {
  it('translate/revert round trip', () => {
    const { axis } = createTimeAxis();
    axis.noHistoryManagedUpdate({
      range: { from: 0, to: 1000 } as Range<UTCTimestamp>,
      screenSize: { main: 1000, second: 0 },
    });

    const value = 250 as UTCTimestamp;
    const screen = axis.translate(value);

    expect(screen).toBeCloseTo(250);
    expect(axis.revert(screen)).toBeCloseTo(value);
  });

  it('zoom at right edge keeps AUTO and enables justFollow', () => {
    const { axis } = createTimeAxis();
    axis.noHistoryManagedUpdate({
      range: { from: 0, to: 1000 } as Range<UTCTimestamp>,
      screenSize: { main: 1000, second: 0 },
      controlMode: ControlMode.AUTO,
      justfollow: false,
    });

    axis.zoom(axis.screenSize.main, -10);

    expect(axis.controlMode.value).toBe(ControlMode.AUTO);
    expect(axis.isJustFollow()).toBe(true);
  });

  it('zoom away from right edge switches to MANUAL', () => {
    const { axis } = createTimeAxis();
    axis.noHistoryManagedUpdate({
      range: { from: 0, to: 1000 } as Range<UTCTimestamp>,
      screenSize: { main: 1000, second: 0 },
      controlMode: ControlMode.AUTO,
      justfollow: false,
    });

    axis.zoom(500, -10);

    expect(axis.controlMode.value).toBe(ControlMode.MANUAL);
    expect(axis.isJustFollow()).toBe(false);
  });

  it('move disables justFollow and switches to MANUAL', () => {
    const { axis } = createTimeAxis();
    axis.noHistoryManagedUpdate({
      range: { from: 0, to: 1000 } as Range<UTCTimestamp>,
      screenSize: { main: 1000, second: 0 },
      controlMode: ControlMode.AUTO,
      justfollow: true,
    });

    axis.move(50);

    expect(axis.controlMode.value).toBe(ControlMode.MANUAL);
    expect(axis.isJustFollow()).toBe(false);
  });
});
