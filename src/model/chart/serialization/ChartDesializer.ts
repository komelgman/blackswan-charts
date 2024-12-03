import type { Chart } from '@/model/chart/Chart';
import defaultChartStyle from '@/model/default-config/ChartStyle.Defaults';
import type { SerializedChart } from '@/model/chart/serialization/types';
import { merge } from '@/model/misc/object.merge';
import type { ChartStyle } from '@/model/chart/types/styles';
import DataSource from '@/model/datasource/DataSource';

export class ChartDeserializer {
  public deserialize(chart: Chart, data: SerializedChart): void {
    const { transactionManager } = chart;

    transactionManager.openTransaction({ protocolTitle: 'chart-deserializer-deserialize-chart-state' });

    chart.panes
      .map((pane) => pane.id)
      .forEach((paneId) => chart.removePane(paneId));

    chart.updateStyle(merge({}, defaultChartStyle, { ...data.style })[0] as ChartStyle);

    data.panes.forEach((paneData) => {
      const ds = new DataSource(
        {
          id: paneData.dataSource.id,
          idHelper: chart.idHelper,
        },
        paneData.dataSource.drawings,
      );

      chart.createPane(ds, paneData.paneOptions);
    });

    chart.timeAxis.range = data.timeAxis.range;
    chart.timeAxis.controlMode = data.timeAxis.controlMode;
    chart.timeAxis.justFollow = data.timeAxis.justfollow;

    const timeAxisPrimaryentry = data.timeAxis.primaryEntry;
    if (timeAxisPrimaryentry.dataSourceId && timeAxisPrimaryentry.entryRef) {
      chart.timeAxis.primaryEntryRef = {
        ds: chart.paneModel(timeAxisPrimaryentry.dataSourceId).dataSource,
        entryRef: timeAxisPrimaryentry.entryRef,
      };
    }

    transactionManager.tryCloseTransaction();
  }
}
