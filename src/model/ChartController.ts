import { PRICE_LABEL_PADDING } from '@/components/chart/layers/PriceAxisLabelsLayer';
import { PaneDescriptor, PaneOptions } from '@/components/layout';
import { PaneId } from '@/components/layout/PaneDescriptor';
import { DeepPartial, merge } from '@/misc/strict-type-checks';
import { PriceScales } from '@/model/axis/scaling/PriceScale';
import TimeAxis from '@/model/axis/TimeAxis';
import ChartState from '@/model/ChartState';
import { ChartStyle } from '@/model/ChartStyle';
import DataSource from '@/model/datasource/DataSource';
import DataSourceInterconnect from '@/model/datasource/DataSourceInterconnect';
import { DrawingType } from '@/model/datasource/Drawing';
import TimeVarianceAuthority from '@/model/history/TimeVarianceAuthority';
import AddNewPane from '@/model/incidents/AddNewPane';
import RemovePane from '@/model/incidents/RemovePane';
import SwapPanes from '@/model/incidents/SwapPanes';
import TogglePane from '@/model/incidents/TogglePane';
import UpdateChartStyle from '@/model/incidents/UpdateChartStyle';
import Sketcher from '@/model/sketchers/Sketcher';
import Viewport, { ViewportOptions } from '@/model/viewport/Viewport';
import { computed, reactive, watch, WatchStopHandle } from 'vue';

export default class ChartController {
  private static paneIdGen: number = 0;

  private readonly panes: PaneDescriptor<Viewport>[];
  private readonly sketchers: Map<DrawingType, Sketcher>;
  private readonly tva: TimeVarianceAuthority;
  private readonly state: ChartState;
  private readonly unwatchers: Map<PaneId, WatchStopHandle[]> = new Map();
  private readonly dataSourceInterconnect: DataSourceInterconnect;

  public readonly timeAxis: TimeAxis;
  public readonly style: ChartStyle;

  constructor(state: ChartState, chartOptions: ChartStyle, tva: TimeVarianceAuthority, sketchers: Map<DrawingType, Sketcher>) {
    this.state = state;
    this.style = reactive(chartOptions);
    this.tva = tva;
    this.sketchers = sketchers;
    this.panes = reactive([]);
    this.timeAxis = new TimeAxis(tva, chartOptions.text);
    this.dataSourceInterconnect = new DataSourceInterconnect();

    watch(computed((): number => this.style.text.fontSize),
      (v) => {
        this.state.timeWidgetHeight = v + 16;
      }, { immediate: true });
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
    // eslint-disable-next-line no-plusplus
    const generatedPaneId: PaneId = `pane${ChartController.paneIdGen++}`; // todo: id generation
    const paneOptions: PaneOptions<ViewportOptions> = {
      id: generatedPaneId,
      minSize: 100,
      priceScale: PriceScales.regular,
      priceInverted: { value: -1 },
    };

    if (options !== undefined) {
      merge(paneOptions, options);
    }

    dataSource.tva = this.tva;

    // todo: pane sizes
    this.tva
      .getProtocol({ incident: 'chart-controller-create-pane' })
      .addIncident(new AddNewPane({
        dataSource,
        paneOptions,
        panes: this.panes,
        style: this.style,
        timeAxis: this.timeAxis,
        sketchers: this.sketchers,
        afterApply: () => this.installPane(paneOptions.id),
        beforeInverse: () => this.uninstallPane(paneOptions.id),
      }))
      .trySign();

    return paneOptions.id;
  }

  public removePane(paneId: PaneId): void {
    // todo: pane sizes
    this.tva
      .getProtocol({ incident: 'chart-controller-remove-pane' })
      .addIncident(new RemovePane({
        panes: this.panes,
        paneIndex: this.indexByPaneId(paneId),
        beforeApply: () => this.uninstallPane(paneId),
        afterInverse: () => this.installPane(paneId),
      }))
      .trySign();
  }

  private installPane(paneId: PaneId): void {
    if (!this.unwatchers.has(paneId)) {
      this.unwatchers.set(paneId, []);
    }

    const pane = this.panes[this.indexByPaneId(paneId)];
    const { priceAxis, dataSource } = pane.model;
    (this.unwatchers.get(paneId) as WatchStopHandle[]).push(
      watch(priceAxis.contentWidth, this.updatePriceAxisWidth.bind(this), { immediate: true }),
    );

    this.dataSourceInterconnect.addDataSource(paneId, dataSource);
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
    // todo: pane sizes
    this.tva
      .getProtocol({ incident: 'chart-controller-toggle-pane' })
      .addIncident(new TogglePane({
        paneDescriptor: this.panes[this.indexByPaneId(paneId)],
      }))
      .trySign();
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
