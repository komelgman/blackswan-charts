import { toRaw } from 'vue';
import type { Chart } from '@/model/chart/Chart';
import { clone } from '@/model/misc/object.clone';
import type { PaneDescriptor } from '@/components/layout/types';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import { merge } from '@/model/misc/object.merge';
import type { DrawingOptions } from '@/model/datasource/types';
import type DataSource from '@/model/datasource/DataSource';
import { isString } from '@/model/type-defs';
import type TimeAxis from '@/model/chart/axis/TimeAxis';

import type { SerializedChart, SerializedPane, SerializedTimeAxis } from '@/model/chart/serialization/types';
import { Themes, type ChartStyle, type ChartTheme } from '@/model/chart/types/styles';

export class ChartSerializer {
  public serialize(chart: Chart): SerializedChart {
    return {
      theme: this.serealizeTheme(chart.style),
      panes: this.serializePanes(chart),
      timeAxis: this.serializeTimeAxis(chart.timeAxis),
    };
  }

  private serealizeTheme(style: ChartStyle): ChartTheme {
    if (style.theme !== Themes.CUSTOM) {
      return style.theme;
    }

    return clone(style) as ChartTheme;
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
          priority: priceAxis.priority,
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
