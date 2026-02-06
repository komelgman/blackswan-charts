import type { DataSourceId } from '@/model/datasource/types';
import type { IdHelper } from 'blackswan-foundation';

export interface DataSourceOptions {
  id?: DataSourceId;
  idHelper: IdHelper;
}
