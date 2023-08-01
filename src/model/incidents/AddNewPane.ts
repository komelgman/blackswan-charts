import type { PaneDescriptor, PaneOptions } from '@/components/layout';
import PriceAxis from '@/model/axis/PriceAxis';
import type TimeAxis from '@/model/axis/TimeAxis';
import type { ChartStyle } from '@/model/ChartStyle';
import type DataSource from '@/model/datasource/DataSource';
import type { DrawingType } from '@/model/datasource/Drawing';
import { AbstractHistoricalIncident } from '@/model/history/HistoricalIncident';
import type { HistoricalIncidentOptions } from '@/model/history/HistoricalIncident';
import type Sketcher from '@/model/sketchers/Sketcher';
import Viewport from '@/model/viewport/Viewport';
import type { ViewportOptions } from '@/model/viewport/Viewport';

export interface AddNewPaneOptions extends HistoricalIncidentOptions {
  dataSource: DataSource;
  sketchers: Map<DrawingType, Sketcher<any>>;
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

    const priceAxis: PriceAxis = new PriceAxis(
      dataSource.id,
      dataSource.tvaClerk,
      style.text,
      paneOptions.priceScale,
      paneOptions.priceInverted,
    );
    priceAxis.postConstruct();

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
