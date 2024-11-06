import { markRaw, reactive } from 'vue';
import type { PaneDescriptor, PaneId, PaneOptions } from '@/components/layout/types';
import { clone } from '@/misc/object.clone';
import { merge } from '@/misc/object.merge';
import { PriceScales } from '@/model/chart/axis/scaling/PriceAxisScale';
import TimeAxis from '@/model/chart/axis/TimeAxis';
import AddNewPane from '@/model/chart/incidents/AddNewPane';
import InvalidatePanesSizes from '@/model/chart/incidents/InvalidatePanesSizes';
import RemovePane from '@/model/chart/incidents/RemovePane';
import SwapPanes from '@/model/chart/incidents/SwapPanes';
import TogglePane from '@/model/chart/incidents/TogglePane';
import UpdateChartStyle from '@/model/chart/incidents/UpdateChartStyle';
import type { ChartStyle } from '@/model/chart/types/styles';
import type { Sketcher } from '@/model/chart/viewport/sketchers';
import { Viewport, type ViewportOptions } from '@/model/chart/viewport/Viewport';
import type DataSource from '@/model/datasource/DataSource';
import DataSourceInterconnect from '@/model/datasource/DataSourceInterconnect';
import type { DrawingType } from '@/model/datasource/types';
import chartOptionsDefaults from '@/model/default-config/ChartStyle.Defaults';
import sketcherDefaults from '@/model/default-config/Sketcher.Defaults';
import type { DeepPartial } from '@/model/type-defs';
import {
  type HistoricalIncidentReportProcessor,
  History,
} from '@/model/history';

export interface ChartOptions {
  style: DeepPartial<ChartStyle>,
  sketchers: Map<DrawingType, Sketcher>
}

export interface ChartState {
  timeWidgetHeight: number;
  priceWidgetWidth: number;
}

export interface PaneRegistrationEvent {
  type: 'install' | 'uninstall';
  pane: PaneDescriptor<Viewport>;
}

declare type PaneRegistrationEventListener = (e: PaneRegistrationEvent) => void;

export class Chart {
  private readonly paneRegEventListeners: PaneRegistrationEventListener[];
  private readonly sketchers: Map<DrawingType, Sketcher>;
  private readonly history: History;
  private readonly dataSourceInterconnect: DataSourceInterconnect;
  public readonly timeAxis: TimeAxis;
  public readonly style: ChartStyle;
  public readonly panes: PaneDescriptor<Viewport>[];

  constructor(chartOptions?: ChartOptions) {
    const chartStyle = this.createChartStyle(chartOptions?.style);
    this.paneRegEventListeners = [];
    this.history = new History();
    this.panes = reactive([]);
    this.style = reactive(chartStyle);
    this.sketchers = markRaw(this.createSketchers(chartStyle, chartOptions?.sketchers));
    this.timeAxis = this.createTimeAxis(chartStyle);
    this.dataSourceInterconnect = new DataSourceInterconnect();
  }

  public addPaneRegistrationEventListener(listener: PaneRegistrationEventListener): Function {
    this.paneRegEventListeners.push(listener);

    return () => this.removePaneRegistrationEventListener(listener);
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
    this.history
      .getProtocol({ protocolTitle: 'chart-controller-update-style' })
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

    dataSource.historicalIncidentReportProcessor = this.historicalIncidentReportProcessor;

    this.history
      .getProtocol({ protocolTitle: 'chart-controller-create-pane' })
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

    this.history
      .getProtocol({ protocolTitle: 'chart-controller-remove-pane' })
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
    this.history
      .getProtocol({ protocolTitle: 'chart-controller-swap-panes' })
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

    this.history
      .getProtocol({ protocolTitle: 'chart-controller-toggle-pane' })
      .addIncident(new TogglePane({
        panes: this.panes,
        paneIndex,
      }))
      .addIncident(new InvalidatePanesSizes({
        panes: this.panes,
        initial: initialSizes,
        changed: this.getPanesSizes(),
      }))
      .trySign();
  }

  public paneModel(paneId: PaneId): Viewport {
    return this.panes[this.indexByPaneId(paneId)].model;
  }

  public get historicalIncidentReportProcessor(): HistoricalIncidentReportProcessor {
    return this.history.reportProcessor.bind(this.history);
  }

  public clearHistory(): void {
    this.history.clear();
  }

  public get isCanRedo(): boolean {
    return this.history.isCanRedo;
  }

  public redo(): void {
    this.history.redo();
  }

  public get isCanUndo(): boolean {
    return this.history.isCanUndo;
  }

  public undo(): void {
    this.history.undo();
  }

  private createChartStyle(style?: DeepPartial<ChartStyle>): ChartStyle {
    if (style) {
      return merge(clone(chartOptionsDefaults), style)[0] as ChartStyle;
    }

    return clone(chartOptionsDefaults);
  }

  private createTimeAxis(chartStyle: ChartStyle): TimeAxis {
    return new TimeAxis(this.historicalIncidentReportProcessor.bind(this), chartStyle.text);
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
