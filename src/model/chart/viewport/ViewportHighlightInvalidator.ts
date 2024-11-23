import type { LayerContext } from '@/components/layered-canvas/types';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import { isEqualDrawingReference, type DataSourceEntry } from '@/model/datasource/types';
import type { Point } from '@/model/chart/types';

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

    const { renderingContext, width, height, dpr } = this.layerContext;
    const inverted = this.viewportModel.priceAxis.inverted.value;
    const { highlighted, selected } = this.viewportModel;
    this.viewportModel.highlighted = undefined;
    this.viewportModel.highlightedHandleId = undefined;
    this.viewportModel.cursor = undefined;
    const screenPos: Point = { x: pos.x * dpr, y: pos.y * dpr };

    renderingContext.save();

    if (inverted < 0) {
      renderingContext.translate(width / 2, height / 2);
      renderingContext.rotate(Math.PI);
      renderingContext.scale(-1, 1);
      renderingContext.translate(-width / 2, -height / 2);
    }

    const { dataSource } = this.viewportModel;
    for (const entry of dataSource.visible(true)) {
      if (entry.drawing === undefined) {
        continue;
      }

      if (selected.has(entry as DataSourceEntry)
        || (highlighted !== undefined && isEqualDrawingReference(entry.descriptor.ref, highlighted.descriptor.ref))) {
        for (const [handleId, graphics] of Object.entries(entry.drawing.handles)) {
          if (graphics.hitTest(renderingContext, screenPos)) {
            this.viewportModel.highlighted = entry as DataSourceEntry;
            this.viewportModel.highlightedHandleId = handleId;
            this.viewportModel.cursor = graphics.cursor || 'pointer';
            break;
          }
        }
      }

      if (this.viewportModel.highlighted === undefined) {
        for (const graphics of entry.drawing.parts) {
          if (graphics.hitTest(renderingContext, screenPos)) {
            this.viewportModel.highlighted = entry as DataSourceEntry;
            this.viewportModel.cursor = 'pointer';
            break;
          }
        }
      }
    }

    renderingContext.restore();
  }
}
