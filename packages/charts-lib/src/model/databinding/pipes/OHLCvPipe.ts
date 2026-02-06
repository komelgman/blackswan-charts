 
import { clone } from 'blackswan-foundation';
import type { OHLCv, OHLCvContentOptions, UTCTimestamp } from '@/model/chart/types';
import { AbstractDataPipe } from '@/model/databinding';

export class OHLCvPipe extends AbstractDataPipe<OHLCvContentOptions, OHLCv> {
  public toContentKey(contentOptions: OHLCvContentOptions): string {
    const { provider, symbol, step } = contentOptions;
    return `${provider ? `${provider}:` : ''}${symbol}:${step}`;
  }

  protected canHandle(contentOptions: OHLCvContentOptions): boolean {
    return contentOptions && contentOptions.type === 'OHLCvContentOptions';
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
}
