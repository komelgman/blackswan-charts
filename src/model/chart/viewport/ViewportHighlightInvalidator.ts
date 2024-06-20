import type { LayerContext } from '@/components/layered-canvas/types';
import type Viewport from '@/model/chart/viewport/Viewport';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import { isEqualDrawingReference } from '@/model/datasource/Drawing';
import type { Point } from '@/model/type-defs';
import { toRaw } from 'vue';

export default class ViewportHighlightInvalidator {
  public layerContext!: LayerContext;

  private readonly viewportModel: Viewport;

  constructor(viewportModel: Viewport) {
    this.viewportModel = viewportModel;
  }

  public invalidate(pos: Point): void {
    if (this.layerContext === undefined) {
      return;
    }

    const { native, width, height, dpr } = this.layerContext;
    const inverted = this.viewportModel.priceAxis.inverted.value;
    const { highlighted, selected } = this.viewportModel;
    this.viewportModel.highlighted = undefined;
    this.viewportModel.highlightedHandleId = undefined;
    this.viewportModel.cursor = undefined;
    const screenPos: Point = { x: pos.x * dpr, y: pos.y * dpr };

    native.save();

    if (inverted < 0) {
      native.translate(width / 2, height / 2);
      native.rotate(Math.PI);
      native.scale(-1, 1);
      native.translate(-width / 2, -height / 2);
    }

    const { dataSource } = this.viewportModel;
    for (const entry of toRaw(dataSource).visible(true)) {
      if (entry.drawing === undefined) {
        continue;
      }

      if (selected.has(entry as DataSourceEntry)
        || (highlighted !== undefined && isEqualDrawingReference(entry.descriptor.ref, highlighted.descriptor.ref))) {
        for (const [handleId, graphics] of Object.entries(entry.drawing.handles)) {
          if (graphics.hitTest(native, screenPos)) {
            this.viewportModel.highlighted = entry as DataSourceEntry;
            this.viewportModel.highlightedHandleId = handleId;
            this.viewportModel.cursor = graphics.cursor || 'pointer';
            break;
          }
        }
      }

      if (this.viewportModel.highlighted === undefined) {
        for (const graphics of entry.drawing.parts) {
          if (graphics.hitTest(native, screenPos)) {
            this.viewportModel.highlighted = entry as DataSourceEntry;
            this.viewportModel.cursor = 'pointer';
            break;
          }
        }
      }
    }

    native.restore();
  }
}
