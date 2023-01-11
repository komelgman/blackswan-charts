import { computed, reactive, watch } from 'vue';
import type { WatchStopHandle } from 'vue';
import type { ChartOptions } from '@/components/chart/ChartWidget.vue';
import chartOptionsDefaults from '@/model/ChartStyle.Defaults';
import sketcherDefaults from '@/model/sketchers/Sketcher.Defaults';
import { PRICE_LABEL_PADDING } from '@/components/chart/layers/PriceAxisLabelsLayer';
import type { PaneDescriptor, PaneOptions } from '@/components/layout';
import type { PaneId } from '@/components/layout/PaneDescriptor';
import type { PanesSizeChangeEvent } from '@/components/layout/PanesSizeChangedEvent';
import { clone, merge } from '@/misc/strict-type-checks';
import type { DeepPartial } from '@/misc/strict-type-checks';
import { PriceScales } from '@/model/axis/scaling/PriceScale';
import TimeAxis from '@/model/axis/TimeAxis';
import type ChartState from '@/model/ChartState';
import type { ChartStyle } from '@/model/ChartStyle';
import type DataSource from '@/model/datasource/DataSource';
import DataSourceInterconnect from '@/model/datasource/DataSourceInterconnect';
import type { DrawingType } from '@/model/datasource/Drawing';
import TimeVarianceAuthority from '@/model/history/TimeVarianceAuthority';
import AddNewPane from '@/model/incidents/AddNewPane';
import InvalidatePanesSizes from '@/model/incidents/InvalidatePanesSizes';
import PanesSizeChanged from '@/model/incidents/PanesSizeChanged';
import RemovePane from '@/model/incidents/RemovePane';
import SwapPanes from '@/model/incidents/SwapPanes';
import TogglePane from '@/model/incidents/TogglePane';
import UpdateChartStyle from '@/model/incidents/UpdateChartStyle';
import type Sketcher from '@/model/sketchers/Sketcher';
import type Viewport from '@/model/viewport/Viewport';
import type { ViewportOptions } from '@/model/viewport/Viewport';

export default class Chart {
  private readonly sketchers: Map<DrawingType, Sketcher>;
  private readonly tva: TimeVarianceAuthority;
  private readonly unwatchers: Map<PaneId, WatchStopHandle[]> = new Map();
  private readonly dataSourceInterconnect: DataSourceInterconnect;
  public readonly timeAxis: TimeAxis;
  public readonly state: ChartState;
  public readonly style: ChartStyle;
  public readonly panes: PaneDescriptor<Viewport>[];

  constructor(chartOptions?: ChartOptions) {
    const chartStyle = this.createChartStyle(chartOptions?.style);
    this.tva = new TimeVarianceAuthority();
    this.panes = reactive([]);
    this.state = reactive({
      priceWidgetWidth: -1,
      timeWidgetHeight: -1,
    });
    this.style = reactive(chartStyle);
    this.sketchers = this.createSketchers(chartStyle, chartOptions?.sketchers);
    // todo: waiting for support experimentalDecorators in playwright
    // this.timeAxis = new TimeAxis(this.tva.clerk, chartStyle.text);
    this.timeAxis = reactive(new TimeAxis(this.tva.clerk, chartStyle.text)) as TimeAxis;
    this.timeAxis.postConstruct();
    // end: todo
    this.dataSourceInterconnect = new DataSourceInterconnect();

    watch(
      computed((): number => this.style.text.fontSize),
      (v) => {
        this.state.timeWidgetHeight = v + 16;
      },
      { immediate: true },
    );
  }

  public updateStyle(options: DeepPartial<ChartStyle>): void {
    this.tva
      .getProtocol({ incident: 'chart-controller-update-style' })
      .addIncident(new UpdateChartStyle({
        style: this.style,
        update: options,
      }));
  }

  public createPane(dataSource: DataSource, options?: Partial<PaneOptions<ViewportOptions>>): PaneId {
    const initialSizes = this.getPanesSizes();
    const paneOptions: PaneOptions<ViewportOptions> = {
      minSize: 100,
      priceScale: PriceScales.regular,
      priceInverted: { value: -1 },
    };

    if (options !== undefined) {
      merge(paneOptions, options);
    }

    dataSource.tvaClerk = this.tva.clerk;

    this.tva
      .getProtocol({ incident: 'chart-controller-create-pane' })
      .addIncident(new AddNewPane({
        dataSource,
        paneOptions,
        panes: this.panes,
        style: this.style,
        timeAxis: this.timeAxis,
        sketchers: this.sketchers,
        afterApply: () => this.installPane(dataSource.id),
        beforeInverse: () => this.uninstallPane(dataSource.id),
      }))
      .addIncident(new InvalidatePanesSizes({
        panes: this.panes,
        initial: initialSizes,
        changed: this.getPanesSizes(),
      }))
      .trySign();

    return dataSource.id;
  }

  public removePane(paneId: PaneId): void {
    const initialSizes = this.getPanesSizes();

    this.tva
      .getProtocol({ incident: 'chart-controller-remove-pane' })
      .addIncident(new RemovePane({
        panes: this.panes,
        paneIndex: this.indexByPaneId(paneId),
        beforeApply: () => this.uninstallPane(paneId),
        afterInverse: () => this.installPane(paneId),
      }))
      .addIncident(new InvalidatePanesSizes({
        panes: this.panes,
        initial: initialSizes,
        changed: this.getPanesSizes(),
      }))
      .trySign();
  }

  public swapPanes(paneId1: PaneId, paneId2: PaneId): void {
    this.tva
      .getProtocol({ incident: 'chart-controller-swap-panes' })
      .addIncident(new SwapPanes({
        panes: this.panes,
        pane1Index: this.indexByPaneId(paneId1),
        pane2Index: this.indexByPaneId(paneId2),
      }))
      .trySign();
  }

  public togglePane(paneId: PaneId): void {
    const initialSizes = this.getPanesSizes();

    this.tva
      .getProtocol({ incident: 'chart-controller-toggle-pane' })
      .addIncident(new TogglePane({
        panes: this.panes,
        paneIndex: this.indexByPaneId(paneId),
      }))
      .addIncident(new InvalidatePanesSizes({
        panes: this.panes,
        initial: initialSizes,
        changed: initialSizes,
      }))
      .trySign();
  }

  public onPaneSizeChanged(event: PanesSizeChangeEvent): void {
    this.tva
      .getProtocol({ incident: 'chart-controller-pane-size-changed', timeout: 1000 })
      .addIncident(new PanesSizeChanged({
        event,
      }), false);
  }

  public paneModel(paneId: PaneId): Viewport {
    return this.panes[this.indexByPaneId(paneId)].model;
  }

  public clearHistory(): void {
    this.tva.clear();
  }

  public canRedo(): boolean {
    return this.tva.canRedo();
  }

  public redo(): void {
    this.tva.redo();
  }

  public canUndo(): boolean {
    return this.tva.canUndo();
  }

  public undo(): void {
    this.tva.undo();
  }

  private createChartStyle(style?: DeepPartial<ChartStyle>): ChartStyle {
    if (style) {
      return merge(clone(chartOptionsDefaults), style)[0] as ChartStyle;
    }

    return clone(chartOptionsDefaults);
  }

  private createSketchers(style: ChartStyle, sketchers?: Map<DrawingType, Sketcher>): Map<DrawingType, Sketcher> {
    const result: Map<DrawingType, Sketcher> = new Map(sketcherDefaults);

    if (sketchers) {
      sketchers.forEach((value, key) => result.set(key, value));
    }

    result.forEach((value) => value.setChartStyle(style));

    return result;
  }

  private getPanesSizes(): Record<string, number> {
    return this.panes.reduce((obj, item) => ({ ...obj, [item.id]: item.size }), {});
  }

  private installPane(paneId: PaneId): void {
    console.debug(`ChartController.installPane: ${paneId}`);

    if (!this.unwatchers.has(paneId)) {
      this.unwatchers.set(paneId, []); // why there is used array???
    }

    const pane = this.panes[this.indexByPaneId(paneId)];
    const { priceAxis, dataSource } = pane.model;
    (this.unwatchers.get(paneId) as WatchStopHandle[]).push(
      watch(priceAxis.contentWidth, this.updatePriceAxisWidth.bind(this), { immediate: true }),
    );

    this.dataSourceInterconnect.addDataSource(dataSource);
  }

  private uninstallPane(paneId: PaneId): void {
    if (!this.unwatchers.has(paneId)) {
      throw new Error(`Oops: !this.unwatchers.has(${paneId})`);
    }

    this.dataSourceInterconnect.removeDataSource(paneId);

    for (const unwatch of (this.unwatchers.get(paneId) as WatchStopHandle[])) {
      unwatch();
    }
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

  private indexByPaneId(paneId: PaneId): number {
    const result: number = this.panes.findIndex((p) => p.id === paneId);
    if (result < 0) {
      throw new Error(`illegal argument exception: wrong pane id: ${paneId}`);
    }

    return result;
  }
}
