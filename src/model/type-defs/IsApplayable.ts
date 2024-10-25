import type { DataSourceEntry } from '@/model/datasource/types';

export interface IsApplayable {
  isApplayable(entry: DataSourceEntry): boolean;
}
