import { reactive } from 'vue';
import type TVAProtocol from '@/model/history/TVAProtocol';
import type { ChartOptions } from '@/components/chart/ChartWidget.vue';
import type { PaneDescriptor, PaneOptions } from '@/components/layout';
import type { PaneId } from '@/components/layout/PaneDescriptor';
import type { DeepPartial } from '@/misc/strict-type-checks';
import { clone, merge } from '@/misc/strict-type-checks';
import { PriceScales } from '@/model/axis/scaling/PriceAxisScale';
import TimeAxis from '@/model/axis/TimeAxis';
import type { ChartStyle } from '@/model/ChartStyle';
import chartOptionsDefaults from '@/model/ChartStyle.Defaults';
import type DataSource from '@/model/datasource/DataSource';
import DataSourceInterconnect from '@/model/datasource/DataSourceInterconnect';
import type { DrawingType } from '@/model/datasource/Drawing';
import TimeVarianceAuthority from '@/model/history/TimeVarianceAuthority';
import type TVAClerk from '@/model/history/TVAClerk';
import AddNewPane from '@/model/incidents/AddNewPane';
import InvalidatePanesSizes from '@/model/incidents/InvalidatePanesSizes';
import RemovePane from '@/model/incidents/RemovePane';
import SwapPanes from '@/model/incidents/SwapPanes';
import TogglePane from '@/model/incidents/TogglePane';
import UpdateChartStyle from '@/model/incidents/UpdateChartStyle';
import type Sketcher from '@/model/sketchers/Sketcher';
import sketcherDefaults from '@/model/sketchers/Sketcher.Defaults';
import type Viewport from '@/model/viewport/Viewport';
import type { ViewportOptions } from '@/model/viewport/Viewport';

export interface PaneRegistrationEvent {
  type: 'install' | 'uninstall';
  pane: PaneDescriptor<Viewport>;
}

export declare type PaneRegistrationEventListener = (e: PaneRegistrationEvent) => void;

export default class Chart {
  private readonly paneRegEventListeners: PaneRegistrationEventListener[];
  private readonly sketchers: Map<DrawingType, Sketcher<any>>;
  private readonly tva: TimeVarianceAuthority;
  private readonly dataSourceInterconnect: DataSourceInterconnect;
  public readonly timeAxis: TimeAxis;
  public readonly style: ChartStyle;
  public readonly panes: PaneDescriptor<Viewport>[];

  constructor(chartOptions?: ChartOptions) {
    const chartStyle = this.createChartStyle(chartOptions?.style);
    this.paneRegEventListeners = [];
    this.tva = new TimeVarianceAuthority();
    this.panes = reactive([]);
    this.style = reactive(chartStyle);
    this.sketchers = this.createSketchers(chartStyle, chartOptions?.sketchers);
    this.timeAxis = this.createTimeAxis(chartStyle);
    this.dataSourceInterconnect = new DataSourceInterconnect();
  }

  public addPaneRegistrationEventListener(listener: PaneRegistrationEventListener): void {
    this.paneRegEventListeners.push(listener);
  }

  public removePaneRegistrationEventListener(listener: PaneRegistrationEventListener): void {
    const index = this.paneRegEventListeners.findIndex((v) => v === listener);
    if (index < 0) {
      console.error('Event listener not found');
      return;
    }

    this.paneRegEventListeners.splice(index, 1);
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
    const paneIndex = this.indexByPaneId(paneId);
    const initialSizes = this.getPanesSizes();
    const tvaProtocol: TVAProtocol = this.tva
      .getProtocol({ incident: 'chart-controller-toggle-pane' });

    tvaProtocol
      .addIncident(new TogglePane({
        panes: this.panes,
        paneIndex,
      }))
      .addIncident(new InvalidatePanesSizes({
        panes: this.panes,
        initial: initialSizes,
        changed: this.getPanesSizes(),
      }));

    tvaProtocol.trySign();
  }

  public paneModel(paneId: PaneId): Viewport {
    return this.panes[this.indexByPaneId(paneId)].model;
  }

  public get tvaClerk(): TVAClerk {
    return this.tva.clerk;
  }

  public clearHistory(): void {
    this.tva.clear();
  }

  public get isCanRedo(): boolean {
    return this.tva.isCanRedo;
  }

  public redo(): void {
    this.tva.redo();
  }

  public get isCanUndo(): boolean {
    return this.tva.isCanUndo;
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

  private createTimeAxis(chartStyle: ChartStyle): TimeAxis {
    const timeAxis = new TimeAxis(this.tva.clerk, chartStyle.text);
    timeAxis.postConstruct();

    return timeAxis;
  }

  private createSketchers(style: ChartStyle, sketchers?: Map<DrawingType, Sketcher<any>>): Map<DrawingType, Sketcher<any>> {
    const result: Map<DrawingType, Sketcher<any>> = new Map(sketcherDefaults);

    if (sketchers) {
      sketchers.forEach((value, key) => result.set(key, value));
    }

    result.forEach((value) => value.setChartStyle(style));

    return result;
  }

  private getPanesSizes(): Record<string, number> {
    return this.panes.reduce((obj, item) => ({
      ...obj,
      [item.id]: item.size,
    }), {});
  }

  private installPane(paneId: PaneId): void {
    const pane = this.panes[this.indexByPaneId(paneId)];
    this.firePaneRegistrationEvent({
      type: 'install',
      pane,
    });

    const { dataSource } = pane.model;
    this.dataSourceInterconnect.addDataSource(dataSource);
  }

  private uninstallPane(paneId: PaneId): void {
    this.dataSourceInterconnect.removeDataSource(paneId);

    this.firePaneRegistrationEvent({
      type: 'uninstall',
      pane: this.panes[this.indexByPaneId(paneId)],
    });
  }

  private firePaneRegistrationEvent(event: PaneRegistrationEvent): void {
    for (const listener of this.paneRegEventListeners) {
      listener.call(listener, event);
    }
  }

  private indexByPaneId(paneId: PaneId): number {
    const result: number = this.panes.findIndex((p) => p.id === paneId);
    if (result < 0) {
      throw new Error(`illegal argument exception: wrong pane id: ${paneId}`);
    }

    return result;
  }
}
