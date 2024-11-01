/* eslint-disable @typescript-eslint/no-unused-vars */
import { clone } from '@/misc/object.clone';
import type { OHLCv, OHLCvContentOptions, UTCTimestamp } from '@/model/chart/types';
import type { DataPipe } from '@/model/databinding';
import type { DataSourceEntry } from '@/model/datasource/types';

export interface OHLCvLoader {
  updateContentOptions(contentOptions: OHLCvContentOptions): void;
  get content(): OHLCv;
  stop(): void;
}

export declare type LoaderFabric = (
  contentKey: string,
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
    return this.canHandle(contentOptions) ? contentOptions : undefined;
  }

  protected canHandle(contentOptions: OHLCvContentOptions): boolean {
    return contentOptions && contentOptions.type === 'OHLCvContentOptions';
  }

  public toContentKey(contentOptions: OHLCvContentOptions): string {
    const { provider, symbol, step } = contentOptions;
    return `${provider ? `${provider}:` : ''}${symbol}:${step}`;
  }

  public startContentLoading(contentOptions: OHLCvContentOptions, contentUpdateCallback: (contentKey: string, content: OHLCv) => void): void {
    const loader = this.loaderFabric(this.toContentKey(contentOptions), contentOptions, contentUpdateCallback);
    console.log({ startedWith: this.toContentKey(contentOptions) });
    if (loader) {
      this.loaders.set(this.toContentKey(contentOptions), loader);
    } else {
      throw new Error(`IllagalState: no loader created for ${contentOptions}`);
    }
  }

  public updateLoaderOptions(newContentOptions: OHLCvContentOptions[]): void {
    if (newContentOptions.length === 0) {
      throw new Error('IllegalState: newContentOptions is empty');
    }

    const contentKey = this.toContentKey(newContentOptions[0]);
    const loader = this.getLoaderByKey(contentKey);

    loader.updateContentOptions(this.mergeOptions(newContentOptions));
  }

  protected mergeOptions(contentOptionsCollection: OHLCvContentOptions[]): OHLCvContentOptions {
    const { type, symbol, step, provider } = contentOptionsCollection[0];

    let extendedRange;
    let visibleTimeRange;
    for (let i = 0; i < contentOptionsCollection.length; ++i) {
      const { extendedRange: er, visibleTimeRange: vtr } = contentOptionsCollection[i];
      if (!extendedRange && er) {
        extendedRange = clone(er);
      } else if (extendedRange && er) {
        extendedRange.barsBefore = Math.max(extendedRange.barsBefore, er.barsBefore);
        if (er.barsAfther) {
          extendedRange.barsAfther = extendedRange.barsAfther
            ? Math.max(extendedRange.barsAfther, er.barsAfther)
            : er.barsAfther;
        }
      }

      if (!visibleTimeRange && vtr) {
        visibleTimeRange = clone(vtr);
      } else if (visibleTimeRange && vtr) {
        visibleTimeRange.from = Math.min(visibleTimeRange.from, vtr.from) as UTCTimestamp;
        visibleTimeRange.to = Math.max(visibleTimeRange.to, vtr.to) as UTCTimestamp;
      }
    }

    return {
      type,
      symbol,
      step,
      provider,
      extendedRange,
      visibleTimeRange,
    };
  }

  public stopContentLoading(contentKey: string): void {
    this.getLoaderByKey(contentKey).stop();
    this.loaders.delete(contentKey);
  }

  public getContent(contentKey: string): OHLCv {
    return this.getLoaderByKey(contentKey).content;
  }

  private getLoaderByKey(contentKey: string): OHLCvLoader {
    if (!this.loaders.has(contentKey)) {
      throw new Error(`IllegalState: no content loader by ${contentKey}`);
    }

    return this.loaders.get(contentKey) as OHLCvLoader;
  }
}
