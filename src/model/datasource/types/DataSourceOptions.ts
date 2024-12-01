import type { DataSourceId } from '@/model/datasource/types';
import type { IdHelper } from '@/model/misc/tools';

export interface DataSourceOptions {
  id?: DataSourceId;
  idHelper: IdHelper;
}
