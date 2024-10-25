import type { OHLCvBar, OHLCvPlot, OHLCvPlotOptions } from '@/model/chart/types';
import type { OHLCvPlotRenderer } from '@/model/chart/viewport/sketchers/renderers';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import type { DataSourceEntry, HandleId } from '@/model/datasource/types';
import type { DragHandle } from '@/model/chart/viewport/DragHandle';
import { OHLCvPlotSketcher } from '@/model/chart/viewport/sketchers';

export class OHLCvVolumeSketcher<O extends OHLCvPlotOptions> extends OHLCvPlotSketcher<O> {
  public constructor(renderer: OHLCvPlotRenderer<O>) {
    super(renderer);
  }

  protected renderBarsToEntry(bars: OHLCvBar[], entry: DataSourceEntry<OHLCvPlot<O>>, viewport: Viewport): void {
    super.renderBarsToEntry(bars, entry, viewport);
    // todo: draw handle for height
  }

  public dragHandle(entry: DataSourceEntry<OHLCvPlot<O>>, viewport: Viewport, handle?: HandleId): DragHandle | undefined {
    // todo: move handle
    return super.dragHandle(entry, viewport, handle);
  }
}
