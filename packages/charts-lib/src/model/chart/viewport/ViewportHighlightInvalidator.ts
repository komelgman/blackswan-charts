import type { LayerContext } from '@blackswan/layered-canvas/model';
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

    const { utilityCanvasContext } = this.layerContext;
    const { highlighted, selected } = this.viewportModel;
    this.viewportModel.highlighted = undefined;
    this.viewportModel.highlightedHandleId = undefined;
    this.viewportModel.cursor = undefined;
    // Paths and the unscaled utility context use CSS pixels; only render layers apply DPR.

    utilityCanvasContext.save();

    const { dataSource } = this.viewportModel;
    for (const entry of dataSource.visible(true)) {
      if (entry.drawing === undefined) {
        continue;
      }

      if (selected.has(entry as DataSourceEntry)
        || (highlighted !== undefined && isEqualDrawingReference(entry.descriptor.ref, highlighted.descriptor.ref))) {
        for (const [handleId, graphics] of Object.entries(entry.drawing.handles)) {
          if (graphics.hitTest(utilityCanvasContext, pos)) {
            this.viewportModel.highlighted = entry as DataSourceEntry;
            this.viewportModel.highlightedHandleId = handleId;
            this.viewportModel.cursor = graphics.cursor || 'pointer';
            break;
          }
        }
      }

      if (this.viewportModel.highlighted === undefined) {
        for (const graphics of entry.drawing.parts) {
          if (graphics.hitTest(utilityCanvasContext, pos)) {
            this.viewportModel.highlighted = entry as DataSourceEntry;
            this.viewportModel.cursor = 'pointer';
            break;
          }
        }
      }
    }

    utilityCanvasContext.restore();
  }
}
