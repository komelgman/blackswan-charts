import { PaneDescriptor, PaneOptions } from '@/components/layout';
import PriceAxis from '@/model/axis/PriceAxis';
import TimeAxis from '@/model/axis/TimeAxis';
import { ChartStyle } from '@/model/ChartStyle';
import DataSource from '@/model/datasource/DataSource';
import { DrawingType } from '@/model/datasource/Drawing';
import {
  AbstractHistoricalIncident,
  HistoricalIncidentOptions,
} from '@/model/history/HistoricalIncident';
import Sketcher from '@/model/sketchers/Sketcher';
import Viewport, { ViewportOptions } from '@/model/viewport/Viewport';

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
    const priceAxis: PriceAxis = new PriceAxis(
      dataSource.tva,
      style.text,
      paneOptions.priceScale,
      paneOptions.priceInverted,
    );

    this.paneDescriptor = {
      model: new Viewport(dataSource, timeAxis, priceAxis, sketchers),
      ...paneOptions,
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
