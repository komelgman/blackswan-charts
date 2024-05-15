import { toRaw } from 'vue';
import type { DragMoveEvent } from '@/components/layered-canvas/LayeredCanvas.vue';
import type PriceAxis from '@/model/chart/axis/PriceAxis';
import type { Inverted } from '@/model/chart/axis/PriceAxis';
import type PriceAxisScale from '@/model/chart/axis/scaling/PriceAxisScale';
import type TimeAxis from '@/model/chart/axis/TimeAxis';
import type DataSource from '@/model/datasource/DataSource';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { DrawingType, HandleId } from '@/model/datasource/Drawing';
import type Sketcher from '@/model/chart/viewport/sketchers/Sketcher';
import type { DragHandle } from '@/model/chart/viewport/DragHandle';

export interface ViewportOptions {
  priceScale: PriceAxisScale;
  priceInverted: Inverted;
}

export default class Viewport {
  private readonly sketchers!: Map<DrawingType, Sketcher>;

  public readonly timeAxis: TimeAxis;
  public readonly priceAxis: PriceAxis;
  public readonly dataSource: DataSource;

  public readonly selected: Set<DataSourceEntry> = new Set();
  public highlighted: DataSourceEntry | undefined;
  public cursor: string | undefined;
  public highlightedHandleId: HandleId | undefined;
  public dragHandle: DragHandle | undefined;

  constructor(
    dataSource: DataSource,
    timeAxis: TimeAxis,
    priceAxis: PriceAxis,
    sketchers: Map<DrawingType, Sketcher>
  ) {
    this.dataSource = dataSource;
    this.timeAxis = timeAxis;
    this.priceAxis = priceAxis;
    this.sketchers = sketchers;
  }

  public updateSelection(isCtrlPressed: boolean, isInDrag: boolean = false): void {
    const { highlighted, selected } = this;

    if (this.selectionShouldBeCleared(isInDrag, isCtrlPressed)) {
      selected.clear();
    }

    if (highlighted !== undefined) {
      if (isCtrlPressed && !isInDrag && selected.has(highlighted)) {
        selected.delete(highlighted);
      } else {
        selected.add(highlighted);
      }
    }
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

  private selectionShouldBeCleared(isInDrag: boolean, isCtrlPressed: boolean): boolean {
    const { highlighted, selected, highlightedHandleId } = this;

    return (isInDrag && highlightedHandleId !== undefined) // drag handle
      || (!isCtrlPressed && isInDrag && highlighted !== undefined && !selected.has(highlighted)) // start dragging no selected element
      || (isInDrag && highlighted === undefined)
      || (!isInDrag && !isCtrlPressed); // click without ctrl
  }

  public cloneSelected(): void {
    const { dataSource, selected } = this;
    const rawDS = toRaw(dataSource);
    const tmp: Set<DataSourceEntry> = new Set();

    for (const entry of selected) {
      if (entry.descriptor.options.locked) {
        continue;
      }

      const clonedEntry: DataSourceEntry = rawDS.clone(entry);
      selected.delete(entry);
      tmp.add(clonedEntry);
    }

    rawDS.flush();
    selected.clear();
    tmp.forEach((value) => selected.add(value));
  }

  public moveSelected(e: DragMoveEvent): void {
    const { dataSource, dragHandle } = this;
    if (dragHandle === undefined) {
      throw new Error('Illegal state: dragHandle === undefined');
    }

    dragHandle(e);
    toRaw(dataSource).flush();
  }

  public updateDragHandle(): void {
    this.dragHandle = this.getDragHandle();
  }

  private getDragHandle(): DragHandle | undefined {
    const { highlighted, selected, highlightedHandleId } = this;

    // case when we drag some handle
    if (highlighted !== undefined && !highlighted.descriptor.options.locked && highlightedHandleId !== undefined) {
      const sketcher: Sketcher = this.getSketcher(highlighted.descriptor.options.type);
      return sketcher.dragHandle(this, highlighted, highlightedHandleId);
    }

    // case when we drag several (mb one) element by body picking
    const dragHandles: DragHandle[] = [];
    for (const entry of selected) {
      if (!entry.descriptor.options.locked) {
        const sketcher: Sketcher = this.getSketcher(entry.descriptor.options.type);
        const dragHandle: DragHandle | undefined = sketcher.dragHandle(this, entry);
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
}
