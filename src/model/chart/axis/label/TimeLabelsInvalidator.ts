import { computed, watch } from 'vue';
import AbstractInvalidator from '@/model/chart/axis/label/AbstractInvalidator';
import type TimeAxis from '@/model/chart/axis/TimeAxis';
import {
  MS_PER_DAY,
  MS_PER_HOUR,
  MS_PER_MINUTE,
  MS_PER_MONTH,
  MS_PER_SECOND,
  MS_PER_YEAR,
  TIME_PERIODS,
  TimePeriods,
  type TimePeriod,
  type UTCTimestamp,
} from '@/model/chart/types';

// Grid time steps
const TIME_INTERVALS = [
  MS_PER_YEAR,
  MS_PER_MONTH * 6, MS_PER_MONTH * 4, MS_PER_MONTH * 3, MS_PER_MONTH * 2, MS_PER_MONTH,
  MS_PER_DAY * 15, MS_PER_DAY * 10, MS_PER_DAY * 7, MS_PER_DAY * 5, MS_PER_DAY * 3, MS_PER_DAY * 2, MS_PER_DAY,
  MS_PER_HOUR * 12, MS_PER_HOUR * 6, MS_PER_HOUR * 4, MS_PER_HOUR * 2, MS_PER_HOUR,
  MS_PER_MINUTE * 30, MS_PER_MINUTE * 15, MS_PER_MINUTE * 10, MS_PER_MINUTE * 5, MS_PER_MINUTE * 2, MS_PER_MINUTE,
  MS_PER_SECOND * 30, MS_PER_SECOND * 15, MS_PER_SECOND * 10, MS_PER_SECOND * 5, MS_PER_SECOND * 2, MS_PER_SECOND,
];

const CUSTOM_ALIGN_MAP = new Map([[TimePeriods.day, TIME_PERIODS.get(TimePeriods.month)]]);

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
    if (this.context === undefined) {
      console.warn('this.context === undefined');
      return;
    }

    this.axis.labels.clear();

    const { main: screenSize } = this.axis.screenSize;
    const labelSize = (this.axis.textStyle.fontSize + 4) * 5;
    const labelsCount = Math.round(screenSize / (2 * labelSize));
    const { from, to } = this.axis.range;

    const dayPeriod = TIME_PERIODS.get(TimePeriods.day) as TimePeriod;
    const interval = this.selectOptimalInterval(from, to, labelsCount);
    const optimalPeriod = this.selectOptimalPeriod(interval);
    const alignToPeriod = CUSTOM_ALIGN_MAP.get(optimalPeriod.name) || optimalPeriod.up || optimalPeriod;
    const shift = Math.floor(alignToPeriod.floor(from) / interval) * interval as UTCTimestamp;

    if (interval <= dayPeriod.averageBarDuration) {
      for (let time = shift; time < to; time = time + interval as UTCTimestamp) {
        this.axis.labels.set(this.axis.translate(time), optimalPeriod.label(time));
      }
    } else {
      console.log({
        a: Math.floor((alignToPeriod.floor(to) - alignToPeriod.floor(from)) / alignToPeriod.averageBarDuration),
        b: labelsCount,
      });

      for (let time = shift; time < to; time = time + interval as UTCTimestamp) {
        this.axis.labels.set(this.axis.translate(alignToPeriod.floor(time)), alignToPeriod.label(time));
      }
    }
  }

  private selectOptimalPeriod(interval: number): TimePeriod {
    const timePeriods = Array.from(TIME_PERIODS.values());
    return timePeriods.find((v) => v.averageBarDuration <= interval) ?? TIME_PERIODS.get(TimePeriods.minimal) as TimePeriod;
  }

  private selectOptimalInterval(from: UTCTimestamp, to: UTCTimestamp, labelsCount: number): number {
    const totalDuration = to - from;

    for (const interval of TIME_INTERVALS) {
      const estimatedLabelsCount = Math.floor(totalDuration / interval);
      if (estimatedLabelsCount > labelsCount) {
        return interval;
      }
    }

    return TIME_INTERVALS[0];
  }
}
