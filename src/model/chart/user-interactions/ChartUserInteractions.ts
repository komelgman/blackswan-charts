import type { Viewport } from '@/model/chart/viewport/Viewport';
import type { InteractionsHandler } from '@/model/chart/user-interactions/InteractionsHandler';
import type TimeAxis from '@/model/chart/axis/TimeAxis';
import type { PriceAxis } from '@/model/chart/axis/PriceAxis';
import type { Chart } from '@/model/chart/Chart';
import type { DragMoveEvent, MouseClickEvent, GenericMouseEvent, ZoomEvent } from '@/components/layered-canvas/events';
import { ControlMode } from '@/model/chart/axis/types';

// todo: keyboard interactions
export interface ChartUserInteractions {
  get viewportInteractionsHandler(): InteractionsHandler<Viewport>;
  get timeAxisInteractionsHandler(): InteractionsHandler<TimeAxis>;
  get priceAxisInteractionsHandler(): InteractionsHandler<PriceAxis>;
}

export class BaseChartUserInteractions implements ChartUserInteractions {
  private readonly chart: Chart;

  public readonly viewportInteractionsHandler: InteractionsHandler<Viewport>;
  public readonly timeAxisInteractionsHandler: InteractionsHandler<TimeAxis>;
  public readonly priceAxisInteractionsHandler: InteractionsHandler<PriceAxis>;

  public constructor(chart: Chart) {
    this.chart = chart;

    this.viewportInteractionsHandler = this.createViewportInteractionsHandler();
    this.timeAxisInteractionsHandler = this.createTimeAxisInteractionsHandler();
    this.priceAxisInteractionsHandler = this.createPriceAxisInteractionsHandler();
  }

  protected createViewportInteractionsHandler(): InteractionsHandler<Viewport> {
    return {
      onMouseMove(source: Viewport, e: GenericMouseEvent): void {
        source.updateHighlightes(e);
      },

      onLeftMouseBtnClick(source: Viewport, e: MouseClickEvent): void {
        source.updateSelection(e.isCtrlPressed);
      },

      onLeftMouseBtnDoubleClick(source: Viewport): void {
        const { highlighted } = source;
        if (highlighted !== undefined) {
          console.log(`double click on element: ${highlighted.descriptor.ref}`);
        } else {
          console.log('double click on viewport');
        }
      },

      onDragStart(source: Viewport, e: MouseClickEvent): void {
        source.startDragging(e);
      },

      onDrag(source: Viewport, e: DragMoveEvent): void {
        source.drag(e);
      },

      onDragEnd(source: Viewport): void {
        source.endDragging();
      },

      onZoom(source: Viewport, e: ZoomEvent): void {
        source.timeAxis.zoom(e.isCtrlPressed ? e.x : source.timeAxis.screenSize.main, e.screenDelta);
      },
    };
  }

  protected createTimeAxisInteractionsHandler(): InteractionsHandler<TimeAxis> {
    return {
      onLeftMouseBtnDoubleClick(source: TimeAxis): void {
        source.controlMode = ControlMode.AUTO;
      },

      onDrag(source: TimeAxis, e: DragMoveEvent): void {
        source.zoom(source.screenSize.main, -e.dx);
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

  protected createPriceAxisInteractionsHandler(): InteractionsHandler<PriceAxis> {
    return {
      onLeftMouseBtnDoubleClick(source: PriceAxis): void {
        source.controlMode = ControlMode.AUTO;
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
