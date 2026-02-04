import { describe, expect, it } from 'vitest';
import { PriceAxis } from '@/model/chart/axis/PriceAxis';
import { UpdateAxisPrimaryEntryRef, UpdateAxisRange } from '@/model/chart/axis/incidents';
import { HistoricalTransactionManager, History } from '@/model/history';
import { IdHelper } from '@/model/misc/tools';
import darkTheme from '@/model/default-config/ChartStyle.Dark.Defaults';
import DataSource from '@/model/datasource/DataSource';
import type { Price, Range } from '@/model/chart/types';

function createPriceAxis() {
  const history = new History();
  const idHelper = new IdHelper();
  const manager = new HistoricalTransactionManager(idHelper, history);
  const axis = new PriceAxis('price', manager, darkTheme.textStyle, 0);

  return axis;
}

describe('Axis incidents', () => {
  it('UpdateAxisRange merges only for the same axis', () => {
    const axis = createPriceAxis();
    const first = new UpdateAxisRange<Price>({
      axis,
      range: { from: 0, to: 10 } as Range<Price>,
    });
    const second = new UpdateAxisRange<Price>({
      axis,
      range: { from: 5, to: 15 } as Range<Price>,
    });

    expect(first.mergeWith(second)).toBe(true);
    expect(first.options.range).toEqual({ from: 5, to: 15 });

    const otherAxis = createPriceAxis();
    const third = new UpdateAxisRange<Price>({
      axis: otherAxis,
      range: { from: -1, to: 1 } as Range<Price>,
    });

    expect(first.mergeWith(third)).toBe(false);
  });

  it('UpdateAxisRange empty detection respects ignoreEmptyChecking', () => {
    const axis = createPriceAxis();
    const incident = new UpdateAxisRange<Price>({
      axis,
      range: { from: 0, to: 10 } as Range<Price>,
    });

    expect(incident.isEmptyIncident()).toBe(true);

    const ignored = new UpdateAxisRange<Price>({
      axis,
      range: { from: 0, to: 10 } as Range<Price>,
      ignoreEmptyChecking: true,
    });

    expect(ignored.isEmptyIncident()).toBe(false);
  });

  it('UpdateAxisPrimaryEntryRef applies and restores previous entry ref', () => {
    const axis = createPriceAxis();
    const idHelper = new IdHelper();
    const ds = new DataSource({ id: 'ds1', idHelper });

    axis.noHistoryManagedUpdate({
      primaryEntryRef: { ds, entryRef: 'entry1' },
    });

    const incident = new UpdateAxisPrimaryEntryRef<Price>({
      axis,
      entryRef: { ds, entryRef: 'entry2' },
    });

    incident.apply();
    expect(axis.primaryEntryRef.value?.entryRef).toBe('entry2');

    incident.inverse();
    expect(axis.primaryEntryRef.value?.entryRef).toBe('entry1');
  });
});
