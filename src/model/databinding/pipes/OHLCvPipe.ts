/* eslint-disable @typescript-eslint/no-unused-vars */
import type { OHLCv, OHLCvContentOptions } from '@/model/chart/types';
import type { DataPipe } from '@/model/databinding';
import type { DataSourceEntry } from '@/model/datasource/types';

export interface OHLCvLoader {
  get content(): OHLCv;
  stop(): void;
}

export declare type LoaderFabric = (
  contentOptions: OHLCvContentOptions,
  contentUpdateCallback: (contentKey: string, content: OHLCv) => void
) => OHLCvLoader;

export class OHLCvPipe implements DataPipe<OHLCvContentOptions, OHLCv> {
  private readonly loaders: Map<string, OHLCvLoader> = new Map();
  private readonly loaderFabric: LoaderFabric;

  constructor(loaderFabric: LoaderFabric) {
    this.loaderFabric = loaderFabric;
  }

  public contentOptions(entry: DataSourceEntry): OHLCvContentOptions | undefined {
    const { contentOptions } = entry.descriptor.options.data;
    if (contentOptions && contentOptions.type === 'OHLCvContentOptions') {
      return contentOptions;
    }

    return undefined;
  }

  public canHandle(contentOptions: OHLCvContentOptions): boolean {
    return true;
  }

  public toContentKey(contentOptions: OHLCvContentOptions): string {
    const { provider, symbol, step } = contentOptions;
    return `${provider ? `${provider}:` : ''}${symbol}:${step}`;
  }

  public startContentLoading(contentOptions: OHLCvContentOptions, contentUpdateCallback: (contentKey: string, content: OHLCv) => void): void {
    this.loaders.set(this.toContentKey(contentOptions), this.loaderFabric(contentOptions, contentUpdateCallback));
  }

  public updateLoaderOptions(newContentOptions: OHLCvContentOptions[]): void {
    // todo
  }

  public stopContentLoading(contentKey: string): void {
    this.getLoaderByKey(contentKey).stop();
    this.loaders.delete(contentKey);
  }

  public getContent(contentKey: string): OHLCv {
    return this.getLoaderByKey(contentKey).content;
  }

  private getLoader(contentOptions: OHLCvContentOptions): OHLCvLoader {
    return this.getLoaderByKey(this.toContentKey(contentOptions));
  }

  private getLoaderByKey(contentKey: string): OHLCvLoader {
    if (this.loaders.has(contentKey)) {
      throw new Error(`IllegalState: no content loader by ${contentKey}`);
    }

    return this.loaders.get(contentKey) as OHLCvLoader;
  }
}
