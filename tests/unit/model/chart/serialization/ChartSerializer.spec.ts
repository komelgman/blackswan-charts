import { nextTick } from 'vue';
import { beforeEach, describe, expect, it } from 'vitest';
import { Chart } from '@/model/chart/Chart';
import { ChartSerializer } from '@/model/chart/serialization/ChartSerializer';
import DataSource from '@/model/datasource/DataSource';
import type { DrawingOptions } from '@/model/datasource/types';
import { IdHelper } from '@/model/misc/tools';
import type { ViewportOptions } from '@/model/chart/viewport/Viewport';
import type { PaneOptions } from '@/components/layout/types';
import { clone } from '@/model/misc/object.clone';
import type { Price, Range, UTCTimestamp } from '@/model/chart/types';
import { ControlMode } from '@/model/chart/axis/types';

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

    chart = new Chart(idHelper);
    serializer = new ChartSerializer();
  });

  it('.style default should be serialized into empty object', async () => {
    const data = serializer.serialize(chart);

    expect(data.style).toEqual({});
  });

  it('.style should be serialized in to diff from default', async () => {
    chart.updateStyle({ backgroundColor: '#000000' });

    const data = serializer.serialize(chart);

    expect(data.style).toEqual({ backgroundColor: '#000000' });
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
