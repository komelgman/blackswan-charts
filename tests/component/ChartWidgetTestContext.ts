import type Chart from '@/model/Chart';
import type DataSource from '@/model/datasource/DataSource';
import type { DataSourceOptions } from '@/model/datasource/DataSource';
import type { DrawingOptions } from '@/model/datasource/Drawing';
import type IdHelper from '@/model/tools/IdHelper';

export default interface ChartWidgetTestContext {
  mount: () => void,
  chart: Chart,
  idHelper: IdHelper,
  newDataSource: (options: DataSourceOptions, drawings: DrawingOptions[]) => DataSource,
}
