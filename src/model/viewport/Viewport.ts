import TimeAxis from '@/model/axis/TimeAxis';
import PriceAxis, { Inverted } from '@/model/axis/PriceAxis';
import type DataSource from '@/model/datasource/DataSource';
import PriceScale from '@/model/axis/scaling/PriceScale';
import { DrawingId, DrawingType, HandleId } from '@/model/datasource/Drawing';
import { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import { toRaw } from 'vue';
import type Sketcher from '@/model/datasource/Sketcher';
import { DragHandle } from '@/model/viewport/DragHandle';
import { DragMoveEvent } from '@/components/layered-canvas/LayeredCanvas.vue';

export interface ViewportOptions {
  priceScale: PriceScale;
  priceInverted: Inverted;
}

export default class Viewport {
  private readonly sketchers!: Map<DrawingType, Sketcher>;

  public readonly timeAxis: TimeAxis;
  public readonly priceAxis: PriceAxis;
  public readonly dataSource: DataSource;

  public readonly selected: Set<DrawingId> = new Set();
  public highlighted: DataSourceEntry | undefined;
  public cursor: string | undefined;
  public highlightedHandleId: HandleId | undefined;
  public dragHandle: DragHandle | undefined;

  constructor(dataSource: DataSource, timeAxis: TimeAxis, priceAxis: PriceAxis, sketchers: Map<DrawingType, Sketcher>) {
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
      const { id } = highlighted[0];
      if (isCtrlPressed && !isInDrag && selected.has(id)) {
        selected.delete(id);
      } else {
        selected.add(id);
      }
    }
  }

  public selectionCanBeDragged(): boolean {
    const { dataSource, selected } = this;

    for (const drawingId of selected) {
      const rawDS = toRaw(dataSource);
      if (!rawDS.get(drawingId)[0].locked) {
        return true;
      }
    }

    return false;
  }

  private selectionShouldBeCleared(isInDrag: boolean, isCtrlPressed: boolean): boolean {
    const { highlighted, selected, highlightedHandleId } = this;

    return (isInDrag && highlightedHandleId !== undefined) // drag handle
      || (!isCtrlPressed && isInDrag && highlighted !== undefined && !selected.has(highlighted[0].id)) // start dragging no selected element
      || (isInDrag && highlighted === undefined)
      || (!isInDrag && !isCtrlPressed); // click without ctrl
  }

  public cloneSelected(): void {
    const { dataSource, selected } = this;
    const rawDS = toRaw(dataSource);
    const tmp: Set<DrawingId> = new Set();

    for (const id of selected) {
      if (rawDS.get(id)[0].locked) {
        continue;
      }

      const clonedEntry: DataSourceEntry = rawDS.clone(id);
      const sketcher: Sketcher = this.getSketcher(clonedEntry[0].type);
      sketcher.draw(clonedEntry, this);
      selected.delete(id);
      tmp.add(clonedEntry[0].id);
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
    dataSource.flush();
  }

  public updateDragHandle(): void {
    this.dragHandle = this.getDragHandle();
  }

  private getDragHandle(): DragHandle | undefined {
    const { dataSource, highlighted, selected, highlightedHandleId } = this;

    // case when we drag some handle
    if (highlighted !== undefined && !highlighted[0].locked && highlightedHandleId !== undefined) {
      const sketcher: Sketcher = this.getSketcher(highlighted[0].type);
      return sketcher.dragHandle(this, highlighted, highlightedHandleId);
    }

    // case when we drag several (mb one) element by body picking
    const dragHandles: DragHandle[] = [];
    for (const id of selected) {
      const entry: DataSourceEntry = dataSource.get(id);
      if (!entry[0].locked) {
        const sketcher: Sketcher = this.getSketcher(entry[0].type);
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
