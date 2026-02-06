import { nextTick } from 'vue';
import { beforeEach, describe, expect, it } from 'vitest';
import { Chart } from '@/model/chart/Chart';
import { ChartSerializer } from '@/model/chart/serialization/ChartSerializer';
import DataSource from '@/model/datasource/DataSource';
import type { DrawingOptions } from '@/model/datasource/types';
import { IdHelper, clone, merge } from 'blackswan-foundation';
import type { ViewportOptions } from '@/model/chart/viewport/Viewport';
import type { PaneOptions } from '@/components/layout/types';
import darkTheme from '@/model/default-config/ChartStyle.Dark.Defaults';
import type { Price, Range, UTCTimestamp } from '@/model/chart/types';
import { ControlMode } from '@/model/chart/axis/types';
import { Themes } from '@/model/chart/types/styles';

describe('ChartSerializer', () => {
  const drawing1: DrawingOptions = {
    id: 'test1',
    data: '',
    type: 'test',
    locked: false,
    visible: true,
    shareWith: '*',
  };

  let ds: DataSource;
  let chart: Chart;
  let serializer: ChartSerializer;

  beforeEach(() => {
    const idHelper = new IdHelper();
    ds = new DataSource({ id: 'main', idHelper });

    chart = new Chart(idHelper, { theme: Themes.DARK });
    serializer = new ChartSerializer();
  });

  it('.style, non CUSTOM themes should be stored by theme name', async () => {
    const data = serializer.serialize(chart);

    expect(data.theme).toEqual(Themes.DARK);
  });

  it('.style update should set custom theme', async () => {
    chart.updateStyle({ backgroundColor: '#000000' });

    const data = serializer.serialize(chart);
    expect(data.theme).toEqual(merge(clone(darkTheme), { backgroundColor: '#000000', theme: Themes.CUSTOM })[0]);
  });

  it('.paneOptions should be serialized', async () => {
    const paneOptions: PaneOptions<ViewportOptions> = {
      maxSize: 300,
      minSize: 100,
      preferredSize: 0.4,
      visible: true,
      priceAxis: {
        inverted: true,
        scale: 'regular',
        primaryEntry: undefined,
        range: { from: -10, to: 10 } as Range<Price>,
        controlMode: ControlMode.AUTO,
        priority: 3,
      },
    };

    chart.createPane(ds, paneOptions);
    ds.beginTransaction();
    ds.add(clone(drawing1));
    ds.endTransaction();
    await nextTick();

    const data = serializer.serialize(chart);

    expect(data.panes).not.toBeUndefined();
    expect(data.panes.length).toBe(1);
    expect(data.panes[0].paneOptions).toEqual(paneOptions);
    expect(data.panes[0].dataSource).toEqual({
      id: 'main',
      drawings: [drawing1],
    });
  });

  it('.timeAxis should be serialized', async () => {
    const data = serializer.serialize(chart);

    expect(data.timeAxis).toEqual({
      range: { from: -1, to: 1 } as Range<UTCTimestamp>,
      controlMode: 'manual',
      justfollow: false,
      primaryEntry: {},
    });
  });
});
