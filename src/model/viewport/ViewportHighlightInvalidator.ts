import { toRaw } from 'vue';
import { isEqualDrawingReference } from '@/model/datasource/Drawing';
import type LayerContext from '@/components/layered-canvas/layers/LayerContext';
import type { DataSourceEntry } from '@/model/datasource/DataSourceEntry';
import type { Point } from '@/model/type-defs';
import type Viewport from '@/model/viewport/Viewport';

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
    const currentHighlighted = this.viewportModel.highlighted;
    const inverted = this.viewportModel.priceAxis.inverted.value;
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
      if (entry[1] === undefined) {
        continue;
      }

      if (currentHighlighted !== undefined && isEqualDrawingReference(entry[0].ref, currentHighlighted[0].ref)) {
        for (const [handleId, graphics] of Object.entries(entry[1].handles)) {
          if (graphics.hitTest(native, screenPos)) {
            this.viewportModel.highlighted = entry as DataSourceEntry;
            this.viewportModel.highlightedHandleId = handleId;
            this.viewportModel.cursor = graphics.cursor || 'pointer';
            break;
          }
        }
      }

      if (this.viewportModel.highlighted === undefined) {
        for (const graphics of entry[1].parts) {
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
