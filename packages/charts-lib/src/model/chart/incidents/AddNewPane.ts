import type { PaneDescriptor, PaneOptions } from '@/components/layout/types';
import { PriceAxis } from '@/model/chart/axis/PriceAxis';
import type TimeAxis from '@/model/chart/axis/TimeAxis';
import type { ChartStyle } from '@/model/chart/types/styles';
import type { Sketcher } from '@/model/chart/viewport/sketchers';
import { type ViewportOptions, Viewport } from '@/model/chart/viewport/Viewport';
import type DataSource from '@/model/datasource/DataSource';
import type { DrawingType } from '@/model/datasource/types';
import { AbstractHistoricalIncident, type HistoricalIncidentOptions } from '@/model/history';

export interface AddNewPaneOptions extends HistoricalIncidentOptions {
  dataSource: DataSource;
  sketchers: Map<DrawingType, Sketcher>;
  paneOptions: PaneOptions<ViewportOptions>;
  style: ChartStyle;
  timeAxis: TimeAxis;
  panes: PaneDescriptor<Viewport>[];
}

export default class AddNewPane extends AbstractHistoricalIncident<AddNewPaneOptions> {
  private readonly paneDescriptor: PaneDescriptor<Viewport>;

  public constructor(options: AddNewPaneOptions) {
    super(options);

    const { dataSource, paneOptions, style, timeAxis, sketchers } = this.options;
    const { primaryEntry, priority } = paneOptions.priceAxis;

    const priceAxis: PriceAxis = new PriceAxis(
      dataSource.id,
      dataSource.transactionManager,
      style.textStyle,
      priority || Number.MIN_VALUE,
    );

    priceAxis.noHistoryManagedUpdate({ ...paneOptions.priceAxis });

    if (primaryEntry) {
      priceAxis.noHistoryManagedUpdate({ primaryEntryRef: { ds: dataSource, entryRef: primaryEntry } });
    }

    this.paneDescriptor = {
      id: dataSource.id,
      model: new Viewport(dataSource, timeAxis, priceAxis, sketchers),
      preferredSize: paneOptions.preferredSize,
      minSize: paneOptions.minSize,
      maxSize: paneOptions.maxSize,
      visible: paneOptions.visible === undefined || paneOptions.visible,
    };
  }

  protected applyIncident(): void {
    const { panes } = this.options;
    panes.push(this.paneDescriptor);
  }

  protected inverseIncident(): void {
    const { panes } = this.options;
    const deleted = panes.pop();
    if (deleted === undefined || deleted.id !== this.paneDescriptor.id) {
      throw new Error('deleted === undefined || deleted.id !== this.paneDescriptor.id');
    }
  }
}
