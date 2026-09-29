import type { ChartStyle } from '@/model/chart/types/styles';
import type { DrawingProjection } from '@/model/chart/drawing/DrawingProjection';
import type { DataSourceEntry } from '@/model/datasource/types';

/** Builds only display caches. Editing and menus have separate contracts. */
export interface Sketcher<T = any> {
  invalidate(entry: DataSourceEntry<T>, projection: DrawingProjection): boolean;
  setChartStyle(chartStyle: ChartStyle): void;
}
