import { computed, markRaw, reactive, watch, type ComputedRef } from 'vue';
import type { PaneDescriptor, PaneId, PaneOptions } from '@/components/layout/types';
import { clone } from '@/model/misc/object.clone';
import { merge } from '@/model/misc/object.merge';
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
import DataSource from '@/model/datasource/DataSource';
import DataSourceInterconnect from '@/model/datasource/DataSourceInterconnect';
import type { DrawingType } from '@/model/datasource/types';
import chartOptionsDefaults from '@/model/default-config/ChartStyle.Defaults';
import sketcherDefaults from '@/model/default-config/Sketcher.Defaults';
import type { DeepPartial } from '@/model/type-defs';
import {
  HistoricalTransactionManager,
  History,
} from '@/model/history';
import { type ChartUserInteractions } from '@/model/chart/user-interactions';
import { DefaultChartUserInteractions } from '@/model/chart/user-interactions/DefaultChartUserInteractions';
import { IdHelper } from '@/model/misc/tools';
import type { Price, Range } from '@/model/chart/types';
import { ControlMode } from '@/model/chart/axis/types';
import type { PriceAxis } from '@/model/chart/axis/PriceAxis';

export interface ChartOptions {
  style: DeepPartial<ChartStyle>;
  sketchers: Map<DrawingType, Sketcher>;
  userInteractions?: ChartUserInteractions;
}

export interface PaneRegistrationEvent {
  type: 'install' | 'uninstall';
  pane: PaneDescriptor<Viewport>;
}

declare type PaneRegistrationEventListener = (e: PaneRegistrationEvent) => void;

export class Chart {
  private readonly visiblePanes: ComputedRef<PaneDescriptor<Viewport>[]>;
  private readonly paneRegEventListeners: PaneRegistrationEventListener[];
  private readonly sketchers: Map<DrawingType, Sketcher>;
  private readonly history: History;
  private readonly dataSourceInterconnect: DataSourceInterconnect;
  public readonly idHelper: IdHelper;
  public readonly transactionManager: HistoricalTransactionManager;
  public readonly timeAxis: TimeAxis;
  public readonly style: ChartStyle;
  public readonly panes: PaneDescriptor<Viewport>[];
  public readonly userInteractions: ChartUserInteractions;

  constructor(idHelper?: IdHelper, chartOptions?: ChartOptions) {
    const chartStyle = this.createChartStyle(chartOptions?.style);
    this.idHelper = idHelper || new IdHelper();
    this.paneRegEventListeners = [];
    this.history = new History();
    this.transactionManager = new HistoricalTransactionManager(this.idHelper, this.history);
    this.panes = reactive([]);
    this.style = reactive(chartStyle);
    this.sketchers = markRaw(this.createSketchers(chartStyle, chartOptions?.sketchers));
    this.timeAxis = this.createTimeAxis(chartStyle);
    this.dataSourceInterconnect = new DataSourceInterconnect();
    this.userInteractions = chartOptions?.userInteractions ?? new DefaultChartUserInteractions(this);

    this.visiblePanes = computed(() => this.panes.filter((item) => item.visible === undefined || item.visible));
    this.installVisiblePanesWatcher();
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
    this.transactionManager.transact({
      protocolOptions: { protocolTitle: 'chart-controller-update-style' },
      incident: new UpdateChartStyle({
        style: this.style,
        update: options,
      }),
    });
  }

  public createPane(dataSource: DataSource, options?: DeepPartial<PaneOptions<ViewportOptions>>): PaneId {
    const initialSizes = this.getPanesSizes();

    const paneOptions: PaneOptions<ViewportOptions> = {
      minSize: 100,
      priceAxis: {
        scale: 'regular',
        inverted: false,
        range: { from: -1, to: 1 } as Range<Price>,
        controlMode: ControlMode.MANUAL,
      },
    };

    if (options !== undefined) {
      merge(paneOptions, options);
    }

    dataSource.transactionManager = this.transactionManager;

    this.transactionManager.openTransaction({ protocolTitle: 'chart-controller-create-pane' });
    this.transactionManager.exeucteInTransaction({
      incident: new AddNewPane({
        dataSource,
        paneOptions,
        panes: this.panes,
        style: this.style,
        timeAxis: this.timeAxis,
        sketchers: this.sketchers,
        afterApply: () => this.installPane(dataSource.id),
        beforeInverse: () => this.uninstallPane(dataSource.id),
      }),
    });

    this.transactionManager.exeucteInTransaction({
      incident: new InvalidatePanesSizes({
        panes: this.panes,
        initial: initialSizes,
        changed: this.getPanesSizes(),
      }),
    });

    this.transactionManager.tryCloseTransaction();

    return dataSource.id;
  }

  public removePane(paneId: PaneId): void {
    const initialSizes = this.getPanesSizes();

    this.transactionManager.openTransaction({ protocolTitle: 'chart-controller-remove-pane' });
    this.transactionManager.exeucteInTransaction({
      incident: new RemovePane({
        panes: this.panes,
        paneIndex: this.indexByPaneId(paneId),
        beforeApply: () => this.uninstallPane(paneId),
        afterInverse: () => this.installPane(paneId),
      }),
    });

    this.transactionManager.exeucteInTransaction({
      incident: new InvalidatePanesSizes({
        panes: this.panes,
        initial: initialSizes,
        changed: this.getPanesSizes(),
      }),
    });

    this.transactionManager.tryCloseTransaction();
  }

  public swapPanes(paneId1: PaneId, paneId2: PaneId): void {
    this.transactionManager.transact({
      protocolOptions: { protocolTitle: 'chart-controller-swap-panes' },
      incident: new SwapPanes({
        panes: this.panes,
        pane1Index: this.indexByPaneId(paneId1),
        pane2Index: this.indexByPaneId(paneId2),
      }),
    });
  }

  public togglePane(paneId: PaneId): void {
    const paneIndex = this.indexByPaneId(paneId);
    const initialSizes = this.getPanesSizes();

    this.transactionManager.openTransaction({ protocolTitle: 'chart-controller-toggle-pane' });

    this.transactionManager.exeucteInTransaction({
      incident: new TogglePane({
        panes: this.panes,
        paneIndex,
      }),
    });

    this.transactionManager.exeucteInTransaction({
      incident: new InvalidatePanesSizes({
        panes: this.panes,
        initial: initialSizes,
        changed: this.getPanesSizes(),
      }),
    });

    this.transactionManager.tryCloseTransaction();
  }

  public paneModel(paneId: PaneId): Viewport {
    return this.panes[this.indexByPaneId(paneId)].model;
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
    return new TimeAxis(this.transactionManager, chartStyle.text);
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

  private installVisiblePanesWatcher() {
    watch(this.visiblePanes, (curState, prevState) => {
      curState
        .filter((pane) => prevState.findIndex((prev) => prev.id === pane.id) < 0)
        .forEach((pane) => this.onShowPane(pane));
      prevState
        .filter((pane) => curState.findIndex((cur) => cur.id === pane.id) < 0)
        .forEach((pane) => this.onHidePane(pane));
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onShowPane(pane: PaneDescriptor<Viewport>) {
    this.updateTimeAxisPrimaryEntry();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onHidePane(pane: PaneDescriptor<Viewport>) {
    this.updateTimeAxisPrimaryEntry();
  }

  private updateTimeAxisPrimaryEntry() {
    const { timeAxis } = this;
    const primaryEntryRef = this.getVisiblePriceAxisWithHighPriority().primaryEntryRef.value;
    let controlMode;
    if (primaryEntryRef && timeAxis.primaryEntryRef.value) {
      controlMode = ControlMode.AUTO;
    }

    timeAxis.noHistoryManagedUpdate({
      primaryEntryRef,
      controlMode,
    });
  }

  private getVisiblePriceAxisWithHighPriority(): PriceAxis {
    const visiblePanes = this.visiblePanes.value;
    let result: PriceAxis = visiblePanes[0].model.priceAxis;

    for (let i = 1; i < visiblePanes.length; i++) {
      const tmp = visiblePanes[i].model.priceAxis;
      if (result.priority < tmp.priority) {
        result = tmp;
      }
    }

    return result;
  }
}
