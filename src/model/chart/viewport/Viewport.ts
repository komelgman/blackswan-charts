import type { DragMoveEvent } from '@/components/layered-canvas/events';
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

export interface ViewportOptions {
  priceAxis: {
    scale: keyof typeof PriceScales;
    inverted: boolean;
    primaryEntry?: DrawingReference;
    range: Range<Price>;
    controlMode: ControlMode;
  }
}

export class Viewport {
  private readonly sketchers!: Map<DrawingType, Sketcher>;

  public readonly timeAxis: TimeAxis;
  public readonly priceAxis: PriceAxis;
  public readonly dataSource: DataSource;
  public readonly highlightInvalidator: ViewportHighlightInvalidator;

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
  ) {
    this.dataSource = dataSource;
    this.timeAxis = timeAxis;
    this.priceAxis = priceAxis;
    this.sketchers = sketchers;
    this.highlightInvalidator = new ViewportHighlightInvalidator(this);
  }

  public installListeners(): void {
    this.dataSource.addChangeEventListener(this.dataSourceChangeEventListener, { immediate: true });
  }

  public uninstallListeners(): void {
    this.dataSource.removeChangeEventListener(this.dataSourceChangeEventListener);
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

  private resetHightlightes(): void {
    this.highlighted = undefined;
    this.highlightedHandleId = undefined;
    this.cursor = undefined;
  }

  public selectionCanBeDragged(): boolean {
    const { selected } = this;

    for (const entry of selected) {
      if (
        !entry.descriptor.options.locked
        && entry.drawing !== undefined
        && Object.keys(entry.drawing.handles).length > 0
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

  public cloneSelected(): void {
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

  public moveSelected(e: DragMoveEvent): void {
    const { dataSource, dragHandle } = this;
    if (dragHandle === undefined) {
      throw new Error('Illegal state: dragHandle === undefined');
    }

    dragHandle(e);
    dataSource.flush();
  }

  public updateDragHandle(): void {
    this.dragHandle = this.getDragHandle();
  }

  private getDragHandle(): DragHandle | undefined {
    const { highlighted, selected, highlightedHandleId } = this;

    // case when we drag some handle
    if (highlighted !== undefined && !highlighted.descriptor.options.locked && highlightedHandleId !== undefined) {
      const sketcher: Sketcher = this.getSketcher(highlighted.descriptor.options.type);
      return sketcher.dragHandle(highlighted, this, highlightedHandleId);
    }

    // case when we drag several (mb one) element by body picking
    const dragHandles: DragHandle[] = [];
    for (const entry of selected) {
      if (!entry.descriptor.options.locked) {
        const sketcher: Sketcher = this.getSketcher(entry.descriptor.options.type);
        const dragHandle: DragHandle | undefined = sketcher.dragHandle(entry, this);
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

  public hasSketcher(type: DrawingType): boolean {
    return this.sketchers.has(type);
  }

  public getSketcher(type: DrawingType): Sketcher {
    const sketcher: Sketcher | undefined = this.sketchers.get(type);

    if (sketcher === undefined) {
      throw new Error(`OOPS, sketcher wasn't found for type ${type}`);
    }

    return sketcher;
  }

  private dataSourceChangeEventListener: DataSourceChangeEventListener = (events: DataSourceChangeEventsMap): void => {
    const removedEntriesEvents = events.get(DataSourceChangeEventReason.RemoveEntry) || [];
    if (removedEntriesEvents.length > 0) {
      this.updateSelectionForRemovedEntries(removedEntriesEvents);
    }
  };

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
}
