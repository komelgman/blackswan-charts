import { computed, watch, type ComputedRef } from 'vue';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import type { InteractionsHandler } from '@/model/chart/user-interactions/InteractionsHandler';
import type TimeAxis from '@/model/chart/axis/TimeAxis';
import type { PriceAxis } from '@/model/chart/axis/PriceAxis';
import type { Chart } from '@/model/chart/Chart';
import type { DragMoveEvent, MouseClickEvent, GenericMouseEvent, ZoomEvent } from '@/components/layered-canvas/events';
import type { PaneDescriptor } from '@/components/layout/types';

// todo: keyboard interactions
export interface ChartUserInteractions {
  get viewportInteractionsHandler(): InteractionsHandler<Viewport>;
  get timeAxisInteractionsHandler(): InteractionsHandler<TimeAxis>;
  get priceAxisInteractionsHandler(): InteractionsHandler<PriceAxis>;
}

export class BaseChartUserInteractions implements ChartUserInteractions {
  private readonly chart: Chart;
  private readonly visiblePanes: ComputedRef<PaneDescriptor<Viewport>[]>;
  public readonly viewportInteractionsHandler: InteractionsHandler<Viewport>;
  public readonly timeAxisInteractionsHandler: InteractionsHandler<TimeAxis>;
  public readonly priceAxisInteractionsHandler: InteractionsHandler<PriceAxis>;

  public constructor(chart: Chart) {
    this.chart = chart;
    this.visiblePanes = computed(() => this.chart.panes.filter((item) => item.visible === undefined || item.visible));

    this.installVisiblePanesWatcher();

    this.viewportInteractionsHandler = this.createViewportInteractionsHandler();
    this.timeAxisInteractionsHandler = this.createTimeAxisInteractionsHandler();
    this.priceAxisInteractionsHandler = this.createPriceAxisInteractionsHandler();
  }

  private installVisiblePanesWatcher() {
    watch(this.visiblePanes, (curState, prevState) => {
      curState
        .filter((pane) => prevState.findIndex((prev) => prev.id === pane.id) < 0)
        .forEach((pane) => this.bindPane(pane));

      prevState
        .filter((pane) => curState.findIndex((cur) => cur.id === pane.id) < 0)
        .forEach((pane) => this.unbindPane(pane));
    });
  }

  private bindPane(pane: PaneDescriptor<Viewport>) {
    console.log({ bind: pane });
  }

  private unbindPane(pane: PaneDescriptor<Viewport>) {
    console.log({ unbind: pane });
  }

  private createViewportInteractionsHandler(): InteractionsHandler<Viewport> {
    return {
      onMouseMove(source: Viewport, e: GenericMouseEvent): void {
        source.highlightInvalidator.invalidate(e);
      },

      onLeftMouseBtnClick(source: Viewport, e: MouseClickEvent): void {
        source.updateSelection(e.isCtrlPressed); // todo: check that is cloneSelected actually used in this case
      },

      onLeftMouseBtnDoubleClick(source: Viewport): void {
        const { highlighted } = source;
        if (highlighted !== undefined) {
          console.log(`double click on element: ${highlighted.descriptor.ref}`);
        } else {
          console.log('double click on viewport');
        }
      },

      // todo: move it to model class
      onDragStart(source: Viewport, e: MouseClickEvent): void {
        source.updateSelection(e.isCtrlPressed, true);

        if (source.selectionCanBeDragged()) {
          source.dataSource.beginTransaction({
            protocolTitle: 'drag-in-viewport',
          });

          if (e.isCtrlPressed) {
            source.cloneSelected();
          }
        } else {
          source.dataSource.transactionManager.openTransaction({ protocolTitle: 'move-in-viewport' });
        }
        source.updateDragHandle();
      },

      // todo: move it to model class
      onDrag(source: Viewport, e: DragMoveEvent): void {
        if (source.selectionCanBeDragged()) {
          source.highlightInvalidator.invalidate(e);
          source.moveSelected(e);
        } else {
          source.timeAxis.move(e.dx);
          if (source.priceAxis.isManualControlMode()) {
            source.priceAxis.move(e.dy);
          }
        }
      },

      onDragEnd(source: Viewport): void {
        if (source.selectionCanBeDragged()) {
          source.dataSource.endTransaction();
        } else {
          source.dataSource.transactionManager.tryCloseTransaction();
        }
      },

      onZoom(source: Viewport, e: ZoomEvent): void {
        source.timeAxis.zoom(e.isCtrlPressed ? e.x : source.timeAxis.screenSize.main, e.screenDelta);
      },
    };
  }

  private createTimeAxisInteractionsHandler(): InteractionsHandler<TimeAxis> {
    return {
      onLeftMouseBtnDoubleClick(source: TimeAxis, e: MouseClickEvent): void {
        console.log({ method: 'onLeftMouseBtnDoubleClick', source, e });
      },

      onDrag(source: TimeAxis, e: DragMoveEvent): void {
        source.zoom(e.elementWidth / 2, -e.dx);
      },

      onZoom(source: TimeAxis, e: ZoomEvent): void {
        source.zoom(e.isCtrlPressed ? e.x : source.screenSize.main, e.screenDelta);
      },

      onLeftMouseBtnClick(): void {},
      onMouseMove(): void {},
      onDragStart(): void {},
      onDragEnd(): void {},
    };
  }

  private createPriceAxisInteractionsHandler(): InteractionsHandler<PriceAxis> {
    return {
      onLeftMouseBtnDoubleClick(source: PriceAxis, e: MouseClickEvent): void {
        console.log({ method: 'onLeftMouseBtnDoubleClick', source, e });
      },

      onDrag(source: PriceAxis, e: DragMoveEvent): void {
        source.zoom(e.elementHeight / 2, -e.dy);
      },

      onZoom(source: PriceAxis, e: ZoomEvent): void {
        source.zoom(e.y, e.screenDelta);
      },

      onLeftMouseBtnClick(): void {},
      onMouseMove(): void {},
      onDragStart(): void {},
      onDragEnd(): void {},
    };
  }
}
