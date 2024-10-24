import AbstractSketcher from '@/model/chart/viewport/sketchers/AbstractSketcher';
import type { Viewport } from '@/model/chart/viewport/Viewport';
import type { DataSourceEntry } from '@/model/datasource/types';
import type { OHLCvPlotOptions, OHLCvPlot } from '@/model/chart/types';

export default class VolumeIndicatorSketcher<O extends OHLCvPlotOptions> extends AbstractSketcher<OHLCvPlot<O>> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected draw(entry: DataSourceEntry<OHLCvPlot<O>>, viewport: Viewport): void {
    if (this.chartStyle === undefined) {
      throw new Error('Illegal state: this.chartStyle === undefined');
    }
  }
}
