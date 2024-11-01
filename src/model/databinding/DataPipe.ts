import type { DataSourceEntry } from '@/model/datasource/types';
import type { ContentOptions } from '@/model/databinding';
import { deepEqual } from '@/misc/object.deepEqual';

export interface ContentLoader<O extends ContentOptions<string>, ContentType> {
  get options(): O;
  get content(): ContentType;
  updateContentOptions(contentOptions: O): void;
  stop(): void;
}

export declare type ContentLoaderFabric<O extends ContentOptions<string>, ContentType> = (
  contentKey: string,
  contentOptions: O,
  contentUpdateCallback: (contentKey: string, content: ContentType) => void
) => ContentLoader<O, ContentType>;

export interface DataPipe<O extends ContentOptions<string>, ContentType> {
  contentOptions(entry: DataSourceEntry): O | undefined;
  toContentKey(contentOptions: O): string;
  startContentLoading(contentOptions: O, contentUpdateCallback: (contentKey: string, content: ContentType) => void): void;
  updateLoaderOptions(newContentOptions: O[]): void;
  stopContentLoading(contentKey: string): void;
  getContent(contentKey: string): ContentType;
}

export abstract class AbstractDataPipe<O extends ContentOptions<string>, ContentType> implements DataPipe<O, ContentType> {
  private readonly loaders: Map<string, ContentLoader<O, ContentType>> = new Map();
  private readonly loaderFabric: ContentLoaderFabric<O, ContentType>;

  constructor(loaderFabric: ContentLoaderFabric<O, ContentType>) {
    this.loaderFabric = loaderFabric;
  }

  public abstract toContentKey(contentOptions: O): string;
  protected abstract canHandle(contentOptions: O): boolean;
  protected abstract mergeOptions(contentOptionsCollection: O[]): O;

  public contentOptions(entry: DataSourceEntry): O | undefined {
    const { contentOptions } = entry.descriptor.options.data;
    return this.canHandle(contentOptions) ? contentOptions : undefined;
  }

  public startContentLoading(contentOptions: O, contentUpdateCallback: (contentKey: string, content: ContentType) => void): void {
    const loader = this.loaderFabric(this.toContentKey(contentOptions), contentOptions, contentUpdateCallback);

    if (loader) {
      this.loaders.set(this.toContentKey(contentOptions), loader);
    } else {
      throw new Error(`IllagalState: no loader created for ${contentOptions}`);
    }
  }

  public updateLoaderOptions(newOptionsArray: O[]): void {
    if (newOptionsArray.length === 0) {
      throw new Error('IllegalState: newContentOptions is empty');
    }

    const contentKey = this.toContentKey(newOptionsArray[0]);
    const loader = this.getLoader(contentKey);
    const newOptions = this.mergeOptions(newOptionsArray);

    if (!deepEqual(loader.options, newOptions)) {
      loader.updateContentOptions(newOptions);
    }
  }

  public stopContentLoading(contentKey: string): void {
    this.getLoader(contentKey).stop();
    this.loaders.delete(contentKey);
  }

  public getContent(contentKey: string): ContentType {
    return this.getLoader(contentKey).content;
  }

  private getLoader(contentKey: string): ContentLoader<O, ContentType> {
    if (!this.loaders.has(contentKey)) {
      throw new Error(`IllegalState: no content loader by ${contentKey}`);
    }

    return this.loaders.get(contentKey) as ContentLoader<O, ContentType>;
  }
}
