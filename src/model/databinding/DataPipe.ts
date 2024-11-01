import type { DataSourceEntry } from '@/model/datasource/types';
import type { ContentOptions } from '@/model/databinding';

export interface DataPipe<O extends ContentOptions<string>, ContentType> {
  contentOptions(entry: DataSourceEntry): O | undefined;
  toContentKey(contentOptions: O): string;
  startContentLoading(contentOptions: O, contentUpdateCallback: (contentKey: string, content: ContentType) => void): void;
  updateLoaderOptions(newContentOptions: O[]): void;
  stopContentLoading(contentKey: string): void;
  getContent(contentKey: string): ContentType;
}
