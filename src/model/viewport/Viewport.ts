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
  public highlighted?: DataSourceEntry = undefined;
  public cursor?: string = undefined;
  public highlightedHandleId?: HandleId = undefined;
  public dragHandle: DragHandle | undefined = undefined;

  constructor(dataSource: DataSource, timeAxis: TimeAxis, priceAxis: PriceAxis, sketchers: Map<DrawingType, Sketcher>) {
    this.dataSource = dataSource;
    this.timeAxis = timeAxis;
    this.priceAxis = priceAxis;
    this.sketchers = sketchers;
  }

  public updateSelection(isCtrlPressed: boolean, isInDrag: boolean = false): void {
    const { dataSource, highlighted, selected } = this;

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

    if (isInDrag && isCtrlPressed) {
      const rawDS = toRaw(dataSource);
      const tmp: Set<DrawingId> = new Set();
      for (const id of selected) {
        const clonedEntry: DataSourceEntry = rawDS.clone(id);
        const sketcher: Sketcher = this.getSketcher(clonedEntry[0].type);
        sketcher.draw(clonedEntry, this);
        selected.delete(id);
        tmp.add(clonedEntry[0].id);
      }
      rawDS.flush();
      tmp.forEach((value) => selected.add(value));
    }
  }

  private selectionShouldBeCleared(isInDrag: boolean, isCtrlPressed: boolean): boolean {
    const { highlighted, selected, highlightedHandleId } = this;

    return (isInDrag && highlightedHandleId !== undefined) // drag handle
      || (!isCtrlPressed && isInDrag && highlighted !== undefined && !selected.has(highlighted[0].id)) // start dragging no selected element
      || (isInDrag && highlighted === undefined)
      || (!isInDrag && !isCtrlPressed); // click without ctrl
  }

  public updateDragHandle(): void {
    const { dataSource, highlighted, selected, highlightedHandleId } = this;
    this.dragHandle = undefined;

    // case when we drag some handle
    if (highlighted !== undefined && !highlighted[0].locked && highlightedHandleId !== undefined) {
      const sketcher: Sketcher = this.getSketcher(highlighted[0].type);
      this.dragHandle = sketcher.dragHandle(this, highlighted, highlightedHandleId);
      return;
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

    if (dragHandles.length === 1) {
      [this.dragHandle] = dragHandles;
    } else if (dragHandles.length > 1) {
      this.dragHandle = (dragEvent: DragMoveEvent): void => dragHandles.forEach((dh) => dh(dragEvent));
    }
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
