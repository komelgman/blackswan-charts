import { watch, type WatchStopHandle } from 'vue';
import type { PriceAxis } from '@/model/chart/axis/PriceAxis';
import type TimeAxis from '@/model/chart/axis/TimeAxis';
import type { OHLCv, OHLCvPlot, OHLCvPlotOptions, Price, Range, UTCTimestamp } from '@/model/chart/types';
import { OHLCV_RECORD_CLOSE } from '@/model/chart/types';
import { TIME_PERIODS_MAP } from '@/model/chart/types/time';
import { isEqualDrawingReference } from '@/model/datasource/types';

export function firstVisibleClose(content: OHLCv | undefined, range: Range<UTCTimestamp>): Price | undefined {
  if (!content?.values.length || range.to <= range.from) return undefined;
  const period = TIME_PERIODS_MAP.get(content.step);
  if (!period) return undefined;
  const index = Math.max(0, Math.floor(period.timeToBar(content.loaded.from, range.from)));
  if (index >= content.values.length || period.barToTime(content.loaded.from, index) >= range.to) return undefined;
  const close = content.values[index]?.[OHLCV_RECORD_CLOSE];
  return close !== undefined && Number.isFinite(close) && close !== 0 ? close : undefined;
}

/** Derived state: follows the primary source even without a mounted renderer. */
export class VisiblePriceReference {
  private stopWatch?: WatchStopHandle;
  private stopSource?: Function;

  constructor(private readonly axis: PriceAxis, private readonly time: TimeAxis) {}

  start(): void {
    this.stop();
    this.stopWatch = watch([this.axis.primaryEntryRef, this.time.range], () => {
      this.stopSource?.();
      this.stopSource = undefined;
      const ref = this.axis.primaryEntryRef.value;
      if (ref) {
        this.stopSource = ref.ds.addChangeEventListener(events => {
          // Render invalidations can be emitted recursively; update only derives
          // a scalar and never writes data or creates a history transaction.
          if (Array.from(events.values()).some(group => group.some(event =>
            isEqualDrawingReference(event.entry.descriptor.ref, ref.entryRef)))) this.update();
        });
      }
      this.update();
    }, { immediate: true });
  }

  stop(): void {
    this.stopWatch?.(); this.stopSource?.();
    this.stopWatch = undefined; this.stopSource = undefined;
  }

  private update(): void {
    const ref = this.axis.primaryEntryRef.value;
    let price: Price | undefined;
    if (ref) {
      // A removed primary entry leaves the reference available for undo.
      const entry = Array.from(ref.ds).find(e => isEqualDrawingReference(e.descriptor.ref, ref.entryRef));
      if (entry?.descriptor.options.type === 'OHLCv') {
        const data = entry.descriptor.options.data as OHLCvPlot<OHLCvPlotOptions>;
        price = firstVisibleClose(data.content, this.time.range);
      }
    }
    this.axis.referencePrice.value = price;
  }
}
