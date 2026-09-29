import type { ChartStyle } from '@/model/chart/types/styles';
import type { DrawingProjection } from '@/model/chart/drawing/DrawingProjection';
import type { Sketcher } from '@/model/chart/viewport/sketchers/Sketcher';
import type { DataSourceEntry } from '@/model/datasource/types';

export abstract class AbstractSketcher<T> implements Sketcher<T> {
  protected chartStyle: ChartStyle | undefined;
  public setChartStyle(chartStyle: ChartStyle): void { this.chartStyle = chartStyle; }
  public invalidate(entry: DataSourceEntry<T>, projection: DrawingProjection): boolean {
    this.draw(entry, projection);
    return entry.descriptor.valid || false;
  }
  protected abstract draw(entry: DataSourceEntry<T>, projection: DrawingProjection): void;
}
