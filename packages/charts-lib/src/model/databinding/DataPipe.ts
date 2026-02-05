import type { DataSourceEntry } from '@/model/datasource/types';
import type { ContentOptions } from '@/model/databinding';
import { deepEqual } from '@/model/misc/object.deepEqual';

export interface ContentProvider<O extends ContentOptions<string>, ContentType> {
  get options(): O;
  get content(): ContentType;
  updateContentOptions(contentOptions: O): void;
  stop(): void;
}

export declare type ContentProviderFabric<O extends ContentOptions<string>, ContentType> = (
  contentKey: string,
  contentOptions: O,
  contentUpdateCallback: (contentKey: string, content: ContentType) => void
) => ContentProvider<O, ContentType>;

export interface DataPipe<O extends ContentOptions<string>, ContentType> {
  getContentOptions(entry: DataSourceEntry): O | undefined;
  toContentKey(contentOptions: O): string;
  subscribe(contentOptions: O, contentUpdateCallback: (contentKey: string, content: ContentType) => void): void;
  updateSubscription(newContentOptions: O[]): void;
  unsubscribe(contentKey: string): void;
  getContent(contentKey: string): ContentType;
}

export abstract class AbstractDataPipe<O extends ContentOptions<string>, ContentType> implements DataPipe<O, ContentType> {
  private readonly providers: Map<string, ContentProvider<O, ContentType>> = new Map();
  private readonly providerFabric: ContentProviderFabric<O, ContentType>;

  constructor(contentProviderFabric: ContentProviderFabric<O, ContentType>) {
    this.providerFabric = contentProviderFabric;
  }

  public abstract toContentKey(contentOptions: O): string;
  protected abstract canHandle(contentOptions: O): boolean;
  protected abstract mergeOptions(contentOptionsCollection: O[]): O;

  public getContentOptions(entry: DataSourceEntry): O | undefined {
    const { contentOptions } = entry.descriptor.options.data;
    return this.canHandle(contentOptions) ? contentOptions : undefined;
  }

  public subscribe(contentOptions: O, contentUpdateCallback: (contentKey: string, content: ContentType) => void): void {
    const provider = this.providerFabric(this.toContentKey(contentOptions), contentOptions, contentUpdateCallback);

    if (provider) {
      this.providers.set(this.toContentKey(contentOptions), provider);
    } else {
      throw new Error(`IllagalState: no provider created for ${contentOptions}`);
    }
  }

  public updateSubscription(newOptionsArray: O[]): void {
    if (newOptionsArray.length === 0) {
      throw new Error('IllegalState: newContentOptions is empty');
    }

    const contentKey = this.toContentKey(newOptionsArray[0]);
    const provider = this.getContentProvider(contentKey);
    const newOptions = this.mergeOptions(newOptionsArray);

    if (!deepEqual(provider.options, newOptions)) {
      provider.updateContentOptions(newOptions);
    }
  }

  public unsubscribe(contentKey: string): void {
    this.getContentProvider(contentKey).stop();
    this.providers.delete(contentKey);
  }

  public getContent(contentKey: string): ContentType {
    return this.getContentProvider(contentKey).content;
  }

  private getContentProvider(contentKey: string): ContentProvider<O, ContentType> {
    if (!this.providers.has(contentKey)) {
      throw new Error(`IllegalState: no content provider by ${contentKey}`);
    }

    return this.providers.get(contentKey) as ContentProvider<O, ContentType>;
  }
}
