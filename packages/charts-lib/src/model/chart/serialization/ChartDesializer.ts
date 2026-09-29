import type { Chart } from '@/model/chart/Chart';
import type { SerializedChart } from '@/model/chart/serialization/types';
import DataSource from '@/model/datasource/DataSource';
import { hasScale } from '@/model/chart/types/HasScale';

export class ChartDeserializer {
  public deserialize(chart: Chart, data: SerializedChart): void {
    const { transactionManager } = chart;

    // Resolve executable scale definitions before changing the current chart.
    // JSON contains IDs, never functions; legacy {id, title, func} shapes also work.
    const resolve = (id: string) => {
      if (!Object.prototype.hasOwnProperty.call(chart.priceScales, id)) throw new Error(`Unknown price scale: ${id}`);
      return chart.priceScales[id];
    };

    const panes = data.panes.map(pane => {
      resolve(pane.paneOptions.priceAxis.scale);

      const drawings = pane.dataSource.drawings.map(drawing => {
        const drawingData: unknown = drawing.data;
        if (!hasScale(drawingData)) return drawing;
        return { ...drawing, data: { ...drawingData, scale: resolve(drawingData.scale.id) } };
      });

      return { ...pane, dataSource: { ...pane.dataSource, drawings } };
    });

    transactionManager.openTransaction({ protocolTitle: 'chart-deserializer-deserialize-chart-state' });

    chart.panes
      .map((pane) => pane.id)
      .forEach((paneId) => chart.removePane(paneId));

    chart.updateTheme(data.theme);

    panes.forEach((paneData) => {
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
