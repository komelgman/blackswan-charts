import { toRaw } from 'vue';
import type { Chart } from '@/model/chart/Chart';
import { clone } from '@/model/misc/object.clone';
import type { PaneDescriptor } from '@/components/layout/types';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import { merge } from '@/model/misc/object.merge';
import type { DrawingOptions } from '@/model/datasource/types';
import defaultChartStyle from '@/model/default-config/ChartStyle.Defaults';
import type DataSource from '@/model/datasource/DataSource';
import { isString } from '@/model/type-defs';
import type TimeAxis from '@/model/chart/axis/TimeAxis';

import type { SerializedChart, SerializedPane, SerializedTimeAxis } from '@/model/chart/serialization/types';

export class ChartSerializer {
  public serialize(chart: Chart): SerializedChart {
    return {
      style: merge(clone(chart.style), defaultChartStyle)[1],
      panes: this.serializePanes(chart),
      timeAxis: this.serializeTimeAxis(chart.timeAxis),
    };
  }

  private serializePanes(chart: Chart): SerializedPane[] {
    const result: SerializedPane[] = [];

    chart.panes.forEach((pane) => result.push(this.serializePane(pane)));

    return result;
  }

  private serializePane(pane: PaneDescriptor<Viewport>): SerializedPane {
    const { priceAxis, dataSource } = pane.model;

    return {
      paneOptions: {
        ...merge({ }, pane, { model: null, id: null })[0],
        priceAxis: {
          inverted: priceAxis.inverted.value > 0,
          scale: priceAxis.scale.id,
          primaryEntry: priceAxis.primaryEntryRef.value?.entryRef,
          range: clone(toRaw(priceAxis.range)),
          controlMode: priceAxis.controlMode.value,
        },
      },
      dataSource: {
        id: dataSource.id,
        drawings: this.serializeDrawings(dataSource),
      },
    };
  }

  private serializeDrawings(dataSource: DataSource): DrawingOptions<any>[] {
    const result: DrawingOptions<any>[] = [];

    for (const { descriptor: { options } } of dataSource.filtered((entry) => isString(entry.descriptor.ref))) {
      result.push(options);
    }

    return result;
  }

  private serializeTimeAxis(timeAxis: TimeAxis): SerializedTimeAxis {
    return {
      range: clone(timeAxis.range),
      controlMode: timeAxis.controlMode.value,
      justfollow: timeAxis.isJustFollow(),
      primaryEntry: {
        dataSourceId: timeAxis.primaryEntryRef.value?.ds.id,
        entryRef: timeAxis.primaryEntryRef.value?.entryRef,
      },
    };
  }
}
