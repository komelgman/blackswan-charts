import type { DataSourceId } from '@/model/datasource/types';
import type IdHelper from '@/model/tools/IdHelper';

export interface DataSourceOptions {
  id?: DataSourceId;
  idHelper: IdHelper;
}
