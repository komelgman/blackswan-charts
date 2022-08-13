import { PaneDescriptor, PaneOptions } from '@/components/layout';
import TimeAxis from '@/model/axis/TimeAxis';
import PriceAxis from '@/model/axis/PriceAxis';
import DataSource from '@/model/datasource/DataSource';
import { computed, reactive, watch } from 'vue';
import { merge } from '@/misc/strict-type-checks';
import ChartState from '@/model/ChartState';
import { PriceScales } from '@/model/axis/scaling/PriceScale';
import { PaneId } from '@/components/layout/PaneDescriptor';
import Viewport, { ViewportOptions } from '@/model/viewport/Viewport';
import Sketcher from '@/model/datasource/Sketcher';
import { DrawingType } from '@/model/datasource/Drawing';
import { ChartStyle } from '@/model/ChartStyle';
import { PRICE_LABEL_PADDING } from '@/components/chart/layers/PriceAxisLabelsLayer';

export default class ChartController {
  private static paneIdGen: number = 0;

  private readonly panes: PaneDescriptor<Viewport>[];
  private readonly sketchers: Map<DrawingType, Sketcher>;

  public readonly timeAxis: TimeAxis;
  public readonly style: ChartStyle;
  public readonly state: ChartState;

  constructor(state: ChartState, chartOptions: ChartStyle, sketchers: Map<DrawingType, Sketcher>) {
    this.state = state;
    this.style = chartOptions;
    this.sketchers = sketchers;
    this.panes = reactive([]);
    this.timeAxis = new TimeAxis(chartOptions.text);

    watch(computed((): number => this.style.text.fontSize),
      (v) => {
        this.state.timeWidgetHeight = v + 16
      }, { immediate: true });
  }

  public createPane(dataSource: DataSource, options?: Partial<PaneOptions<ViewportOptions>>): PaneId {
    // eslint-disable-next-line no-plusplus
    const generatedPaneId: PaneId = `pane${ChartController.paneIdGen++}`;
    const paneOptions: PaneOptions<ViewportOptions> = {
      id: generatedPaneId,
      minSize: 100,
      priceScale: PriceScales.regular,
      priceInverted: { value: -1 },
    };

    if (options !== undefined) {
      merge(paneOptions, options);
    }

    return this.newPane(dataSource, paneOptions);
  }

  private newPane(dataSource: DataSource, options: PaneOptions<ViewportOptions>): PaneId {
    const priceAxis: PriceAxis = new PriceAxis(this.style.text, options.priceScale, options.priceInverted);
    const paneDescriptor: PaneDescriptor<Viewport> = {
      model: new Viewport(dataSource, this.timeAxis, priceAxis),
      ...options,
    };

    this.panes.push(paneDescriptor);

    watch(priceAxis.contentWidth, this.updatePriceAxisWidth.bind(this));

    return paneDescriptor.id;
  }

  private updatePriceAxisWidth(): void {
    let maxLabelWidth = -1;
    for (const pane of this.panes) {
      const labelWidth: number = pane.model.priceAxis.contentWidth.value;
      if (maxLabelWidth < labelWidth) {
        maxLabelWidth = labelWidth;
      }
    }

    this.state.priceWidgetWidth = maxLabelWidth + 2 * PRICE_LABEL_PADDING;
  }

  public removePane(paneId: PaneId): void {
    this.panes.splice(this.indexByPaneId(paneId), 1);
  }

  public swapPanes(paneId1: PaneId, paneId2: PaneId): void {
    const id1 = this.indexByPaneId(paneId1);
    const id2 = this.indexByPaneId(paneId2);

    if (id1 >= this.panes.length || id2 >= this.panes.length) {
      return;
    }

    const { panes } = this;
    const tmp: PaneDescriptor<Viewport> = panes[id1];
    panes[id1] = panes[id2];

    // trigger change
    panes.splice(id2, 1, tmp);
  }

  public paneDescriptor(paneId: PaneId): PaneDescriptor<Viewport> {
    return this.panes[this.indexByPaneId(paneId)];
  }

  public paneModel(paneId: PaneId): Viewport {
    return this.panes[this.indexByPaneId(paneId)].model;
  }

  private indexByPaneId(paneId: PaneId): number {
    const result: number = this.panes.findIndex((p) => p.id === paneId);
    if (result < 0) {
      throw new Error(`illegal argument exception: wrong pane id: ${paneId}`);
    }

    return result;
  }
}
