import type { OHLCvPlotOptions, OHLCvBar, OHLCvPlot } from '@/model/chart/types';
import type { DataSourceEntry } from '@/model/datasource/types';
import type { Viewport } from '@/model/chart/viewport/Viewport';

export interface OHLCvPlotRenderer<O extends OHLCvPlotOptions> {
  get name(): string;
  renderBarsToEntry(bars: OHLCvBar[], entry: DataSourceEntry<OHLCvPlot<O>>, viewport: Viewport): void;
}
