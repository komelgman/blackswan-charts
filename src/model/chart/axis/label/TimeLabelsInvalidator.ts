import { computed, watch } from 'vue';
import AbstractInvalidator from '@/model/chart/axis/label/AbstractInvalidator';
import type TimeAxis from '@/model/chart/axis/TimeAxis';
import { type UTCTimestamp } from '@/model/chart/types';
import {
  MS_PER_DAY,
  MS_PER_HOUR,
  MS_PER_MINUTE,
  MS_PER_MONTH,
  MS_PER_SECOND,
  MS_PER_YEAR,
  TIME_PERIODS_MAP,
  TimePeriods,
  type TimePeriod,
} from '@/model/chart/types/time';

// Grid time steps
const TIME_INTERVALS = [
  MS_PER_YEAR * 25, MS_PER_YEAR * 20, MS_PER_YEAR * 10, MS_PER_YEAR * 4, MS_PER_YEAR * 2, MS_PER_YEAR,
  MS_PER_MONTH * 6, MS_PER_MONTH * 4, MS_PER_MONTH * 3, MS_PER_MONTH * 2, MS_PER_MONTH,
  MS_PER_DAY * 15, MS_PER_DAY * 10, MS_PER_DAY * 6, MS_PER_DAY * 3, MS_PER_DAY * 2, MS_PER_DAY,
  MS_PER_HOUR * 12, MS_PER_HOUR * 6, MS_PER_HOUR * 4, MS_PER_HOUR * 2, MS_PER_HOUR,
  MS_PER_MINUTE * 30, MS_PER_MINUTE * 15, MS_PER_MINUTE * 10, MS_PER_MINUTE * 5, MS_PER_MINUTE * 2, MS_PER_MINUTE,
  MS_PER_SECOND * 30, MS_PER_SECOND * 15, MS_PER_SECOND * 10, MS_PER_SECOND * 5, MS_PER_SECOND * 2, MS_PER_SECOND,
];

// todo: perf optimizations
// todo: add cache
export default class TimeLabelsInvalidator extends AbstractInvalidator {
  public readonly axis: TimeAxis;

  constructor(axis: TimeAxis) {
    super();

    this.axis = axis;

    watch([
      axis.range,
      axis.textStyle,
      computed(() => axis.screenSize.main),
    ], this.invalidate.bind(this));
  }

  public invalidate(): void {
    const labels = new Map<number, string>();

    const { main: screenSize } = this.axis.screenSize;
    const labelSize = (this.axis.textStyle.fontSize + 4) * 5;
    const labelsCount = screenSize / (2 * labelSize);
    const { from, to } = this.axis.range;

    const dayPeriod = TIME_PERIODS_MAP.get(TimePeriods.day) as TimePeriod;
    const interval = this.selectOptimalInterval(from, to, labelsCount);
    const optimalPeriod = this.selectOptimalPeriod(interval);
    const alignToPeriod = this.selectAlignToPeriod(optimalPeriod);
    const alignedFrom = alignToPeriod.floor(from) as UTCTimestamp;

    if (interval <= dayPeriod.averageBarDuration) {
      for (let time = alignedFrom; time < to; time = time + interval as UTCTimestamp) {
        labels.set(this.axis.translate(time), optimalPeriod.label(time));
      }
    } else {
      const alignedTo = alignToPeriod.ceil(to);
      const tmpAll: UTCTimestamp[] = [];
      const tmpUp: number[] = [];
      let time = alignedFrom;
      let i = 0;
      do {
        tmpAll.push(time);
        if (alignToPeriod.is(time)) {
          tmpUp.push(i);
        }
        time = time + optimalPeriod.getBarDuration(time) as UTCTimestamp;
        i++;
      } while (time <= alignedTo);

      let labelTime = 0 as UTCTimestamp;
      for (let j = 0; j < tmpUp.length - 1; j++) {
        const a = tmpUp[j];
        const ta = tmpAll[a];
        const b = tmpUp[j + 1];
        const tb = tmpAll[b];
        const c = Math.round(((b - a) * interval) / (tb - ta));

        for (let k = a; k < b; k += c || 1) {
          labelTime = tmpAll[k];
          if (tb - labelTime < (interval * (2 / 3))) {
            continue;
          }

          labels.set(this.axis.translate(labelTime), optimalPeriod.label(labelTime));
        }
      }
    }

    this.axis.noHistoryManagedUpdate({ labels });
  }

  private selectOptimalInterval(from: UTCTimestamp, to: UTCTimestamp, labelsCount: number): number {
    const totalDuration = to - from;

    for (const interval of TIME_INTERVALS) {
      const estimatedLabelsCount = Math.floor(totalDuration / interval);
      if (estimatedLabelsCount > labelsCount) {
        return interval;
      }
    }

    return TIME_INTERVALS[TIME_INTERVALS.length - 1];
  }

  private selectAlignToPeriod(optimalPeriod: TimePeriod): TimePeriod {
    if (optimalPeriod.name === TimePeriods.day) {
      return TIME_PERIODS_MAP.get(TimePeriods.month) as TimePeriod;
    }

    if (optimalPeriod.averageBarDuration < MS_PER_HOUR) {
      return TIME_PERIODS_MAP.get(TimePeriods.h1) as TimePeriod;
    }

    if (optimalPeriod.averageBarDuration < MS_PER_DAY) {
      return TIME_PERIODS_MAP.get(TimePeriods.day) as TimePeriod;
    }

    return optimalPeriod.up ?? optimalPeriod;
  }

  private selectOptimalPeriod(interval: number): TimePeriod {
    const timePeriods = Array.from(TIME_PERIODS_MAP.values());
    return timePeriods.find((v) => (v.averageBarDuration <= interval) && (v.name !== TimePeriods.week))
      ?? TIME_PERIODS_MAP.get(TimePeriods.minimal) as TimePeriod;
  }
}
