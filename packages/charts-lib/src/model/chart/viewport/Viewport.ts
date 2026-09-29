import { createDrawingProjection, type DrawingProjection } from '@/model/chart/drawing/DrawingProjection';
import type { DrawingBehavior } from '@/model/chart/drawing/DrawingBehavior';
import defaultBehaviors from '@/model/default-config/DrawingBehavior.Defaults';
import type { DragMoveEvent, GenericMouseEvent, MouseClickEvent } from '@blackswan/layered-canvas/model';
import type { PriceAxis } from '@/model/chart/axis/PriceAxis';
import type { PriceScales } from '@/model/chart/axis/scaling/PriceAxisScale';
import type TimeAxis from '@/model/chart/axis/TimeAxis';
import type { DragHandle } from '@/model/chart/viewport/DragHandle';
import type { Sketcher } from '@/model/chart/viewport/sketchers';
import ViewportHighlightInvalidator from '@/model/chart/viewport/ViewportHighlightInvalidator';
import type DataSource from '@/model/datasource/DataSource';
import {
  DataSourceChangeEventReason,
  type DataSourceChangeEvent,
  type DataSourceChangeEventListener,
  type DataSourceChangeEventsMap,
} from '@/model/datasource/events';
import type { DataSourceEntry, DrawingReference, DrawingType, HandleId } from '@/model/datasource/types';
import type { Price, Range } from '@/model/chart/types';
import type { ControlMode } from '@/model/chart/axis/types';
import { VisiblePriceReference } from '@/model/chart/axis/scaling/VisiblePriceReference';

export interface ViewportOptions {
  priceAxis: {
    range: Range<Price>;
    scale: keyof typeof PriceScales;
    inverted: boolean;
    controlMode: ControlMode;
    primaryEntry?: DrawingReference;
    priority?: number;
  }
}

export class Viewport {
  private readonly sketchers!: Map<DrawingType, Sketcher>;
  private readonly drawingBehaviors: ReadonlyMap<DrawingType, DrawingBehavior>;
  private dataSourceChangeEventListener: DataSourceChangeEventListener = (events: DataSourceChangeEventsMap): void => {
    const removedEntriesEvents = events.get(DataSourceChangeEventReason.RemoveEntry) || [];
    if (removedEntriesEvents.length > 0) {
      this.updateSelectionForRemovedEntries(removedEntriesEvents);
    }
  };

  public readonly timeAxis: TimeAxis;
  public readonly priceAxis: PriceAxis;
  public readonly dataSource: DataSource;
  public readonly projection: DrawingProjection;
  public readonly highlightInvalidator: ViewportHighlightInvalidator;
  public readonly priceReference: VisiblePriceReference;

  public readonly selected: Set<DataSourceEntry> = new Set();
  public highlighted: DataSourceEntry | undefined;
  public cursor: string | undefined;
  public highlightedHandleId: HandleId | undefined;
  public dragHandle: DragHandle | undefined;

  constructor(
    dataSource: DataSource,
    timeAxis: TimeAxis,
    priceAxis: PriceAxis,
    sketchers: Map<DrawingType, Sketcher>,
    drawingBehaviors: ReadonlyMap<DrawingType, DrawingBehavior> = defaultBehaviors,
  ) {
    this.dataSource = dataSource;
    this.timeAxis = timeAxis;
    this.priceAxis = priceAxis;
    this.sketchers = sketchers;
    this.drawingBehaviors = drawingBehaviors;
    this.projection = createDrawingProjection(this);
    this.highlightInvalidator = new ViewportHighlightInvalidator(this);
    this.priceReference = new VisiblePriceReference(priceAxis, timeAxis);
  }

  public installListeners(): void {
    this.dataSource.addChangeEventListener(this.dataSourceChangeEventListener, { immediate: true });
  }

  public uninstallListeners(): void {
    this.dataSource.removeChangeEventListener(this.dataSourceChangeEventListener);
  }

  public getSketcher(type: DrawingType): Sketcher {
    const sketcher: Sketcher | undefined = this.sketchers.get(type);

    if (sketcher === undefined) {
      throw new Error(`OOPS, sketcher wasn't found for type ${type}`);
    }

    return sketcher;
  }

  public updateHighlightes(e: GenericMouseEvent): void {
    this.highlightInvalidator.invalidate(e);
  }

  public updateSelection(cloneSelectedIfIsPresent: boolean, isInDragMode: boolean = false): void {
    const { highlighted, selected } = this;

    if (this.selectionShouldBeCleared(cloneSelectedIfIsPresent, isInDragMode)) {
      selected.clear();
    }

    if (highlighted !== undefined) {
      if (cloneSelectedIfIsPresent && !isInDragMode && selected.has(highlighted)) {
        selected.delete(highlighted);
      } else {
        selected.add(highlighted);
      }
    }
  }

  public startDragging(e: MouseClickEvent) {
    this.updateSelection(e.isCtrlPressed, true);
    const { dataSource } = this;
    if (this.selectionCanBeDragged()) {
      dataSource.beginTransaction({
        protocolTitle: 'drag-in-viewport',
      });

      if (e.isCtrlPressed) {
        this.cloneSelected();
      }
    } else {
      dataSource.transactionManager.openTransaction({ protocolTitle: 'move-in-viewport' });
    }

    this.updateDragHandle();
  }

  public drag(e: DragMoveEvent) {
    const { priceAxis, timeAxis } = this;
    if (this.selectionCanBeDragged()) {
      this.highlightInvalidator.invalidate(e);
      this.moveSelected(e);
    } else {
      timeAxis.move(e.dx);
      if (priceAxis.isManualControlMode()) {
        priceAxis.move(e.dy);
      }
    }
  }

  public endDragging() {
    const { dataSource } = this;
    if (this.selectionCanBeDragged()) {
      dataSource.endTransaction();
    } else {
      dataSource.transactionManager.tryCloseTransaction();
    }
  }

  private selectionCanBeDragged(): boolean {
    const { selected } = this;

    for (const entry of selected) {
      if (
        !entry.descriptor.options.locked
        && this.drawingBehaviors.has(entry.descriptor.options.type)
      ) {
        return true;
      }
    }

    return false;
  }

  private selectionShouldBeCleared(cloneSelectedIfIsPresent: boolean, isInDragMode: boolean): boolean {
    const { highlighted, selected, highlightedHandleId } = this;

    return (isInDragMode && highlightedHandleId !== undefined) // drag handle
      || (!cloneSelectedIfIsPresent && isInDragMode && highlighted !== undefined && !selected.has(highlighted)) // start dragging no selected element
      || (isInDragMode && highlighted === undefined)
      || (!isInDragMode && !cloneSelectedIfIsPresent); // click without ctrl
  }

  private cloneSelected(): void {
    const { dataSource, selected } = this;
    const tmp: Set<DataSourceEntry> = new Set();

    for (const entry of selected) {
      if (entry.descriptor.options.locked) {
        continue;
      }

      const clonedEntry: DataSourceEntry = dataSource.clone(entry);
      selected.delete(entry);
      tmp.add(clonedEntry);
    }

    dataSource.flush();
    selected.clear();
    tmp.forEach((value) => selected.add(value));
  }

  private moveSelected(e: DragMoveEvent): void {
    const { dataSource, dragHandle } = this;
    if (dragHandle === undefined) {
      throw new Error('Illegal state: dragHandle === undefined');
    }

    dragHandle(e);
    dataSource.flush();
  }

  private updateDragHandle(): void {
    this.dragHandle = this.getDragHandle();
  }

  private getDragHandle(): DragHandle | undefined {
    const { highlighted, selected, highlightedHandleId } = this;

    // case when we drag some handle
    if (highlighted !== undefined && !highlighted.descriptor.options.locked && highlightedHandleId !== undefined) {
      return this.createDrawingDrag(highlighted, highlightedHandleId);
    }

    // case when we drag several (mb one) element by body picking
    const dragHandles: DragHandle[] = [];
    for (const entry of selected) {
      if (!entry.descriptor.options.locked) {
        const dragHandle = this.createDrawingDrag(entry);
        if (dragHandle !== undefined) {
          dragHandles.push(dragHandle);
        }
      }
    }

    let result: DragHandle | undefined;
    if (dragHandles.length === 1) {
      [result] = dragHandles;
    } else if (dragHandles.length > 1) {
      result = (dragEvent: DragMoveEvent): void => dragHandles.forEach((dh) => dh(dragEvent));
    }

    return result;
  }

  private createDrawingDrag(entry: DataSourceEntry, handle?: HandleId): DragHandle | undefined {
    const behavior = this.drawingBehaviors.get(entry.descriptor.options.type);
    if (!behavior || entry.descriptor.options.locked) return undefined;
    return event => {
      const { options, ref } = entry.descriptor;
      if (options.locked) return;
      const patch = behavior(options.data, this.projection, event, handle);
      if (patch) this.dataSource.update(ref, { data: patch });
    };
  }

  private updateSelectionForRemovedEntries(removedEntriesEvents: DataSourceChangeEvent[]): void {
    const { selected, highlighted } = this;

    for (const event of removedEntriesEvents) {
      if (highlighted === event.entry) {
        this.resetHightlightes();
      }

      if (selected.has(event.entry)) {
        selected.delete(event.entry);
      }
    }
  }

  private resetHightlightes(): void {
    this.highlighted = undefined;
    this.highlightedHandleId = undefined;
    this.cursor = undefined;
  }
}
