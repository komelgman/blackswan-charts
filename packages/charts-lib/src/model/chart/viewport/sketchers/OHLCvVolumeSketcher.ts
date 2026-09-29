import type { OHLCvBar, OHLCvPlot, OHLCvPlotOptions } from '@/model/chart/types';
import type { OHLCvPlotRenderer } from '@/model/chart/viewport/sketchers/renderers';
import type { DrawingProjection } from '@/model/chart/drawing/DrawingProjection';
import type { DataSourceEntry } from '@/model/datasource/types';
import { OHLCvPlotSketcher } from '@/model/chart/viewport/sketchers';

export const DEFAULT_VOLUME_INDICATOR_HEIGHT_FACTOR = 0.15;

export class OHLCvVolumeSketcher<O extends OHLCvPlotOptions> extends OHLCvPlotSketcher<O> {
  public constructor(renderer: OHLCvPlotRenderer<O>) {
    super(renderer);
  }

  protected renderBarsToEntry(bars: OHLCvBar[], entry: DataSourceEntry<OHLCvPlot<O>>, viewport: DrawingProjection): void {
    super.renderBarsToEntry(bars, entry, viewport);
    // todo: draw handle for height
  }

}
