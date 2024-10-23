import type { OHCLvBar, OHLCvChart } from '@/model/chart/types';
import type { DataSourceEntry } from '@/model/datasource/types';
import type { Viewport } from '@/model/chart/viewport/Viewport';

export interface ChartRenderer {
  get name(): string;
  renderBarsToEntry(bars: OHCLvBar[], entry: DataSourceEntry<OHLCvChart<any>>, viewport: Viewport): void;
}
