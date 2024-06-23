import type Chart from '@/model/chart/Chart';
import type DataSource from '@/model/datasource/DataSource';
import type { DrawingOptions, DataSourceOptions } from '@/model/datasource/types';
import type IdHelper from '@/model/tools/IdHelper';

export default interface ChartWidgetTestContext {
  delay: () => Promise<void>
  mount: () => void,
  chart: Chart,
  idHelper: IdHelper,
  newDataSource: (options: DataSourceOptions, drawings: DrawingOptions[]) => DataSource,
  toRaw: <T>(observed: T) => T,
}
