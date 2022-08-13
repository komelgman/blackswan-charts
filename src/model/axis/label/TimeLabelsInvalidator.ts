import { LogicSize, UTCTimestamp } from '@/model/type-defs';
import type TimeAxis from '@/model/axis/TimeAxis';
import makeFont from '@/misc/make-font';
import { computed, watch } from 'vue';
import { LabelOptions } from '@/model/axis/label/LabelOptions';
import AbstractInvalidator from '@/model/AbstractInvalidator';

const SECOND = 1000
const MINUTE = SECOND * 60
const MINUTE3 = MINUTE * 3
const MINUTE5 = MINUTE * 5
const MINUTE15 = MINUTE * 15
const MINUTE30 = MINUTE * 30
const HOUR = MINUTE * 60
const HOUR4 = HOUR * 4
const HOUR12 = HOUR * 12
const DAY = HOUR * 24
const WEEK = DAY * 7
const MONTH = WEEK * 4
const YEAR = DAY * 365

// Grid time steps
const TIMESCALES = [
  YEAR * 10, YEAR * 5, YEAR * 3, YEAR * 2, YEAR,
  MONTH * 6, MONTH * 4, MONTH * 3, MONTH * 2, MONTH,
  DAY * 15, DAY * 10, DAY * 7, DAY * 5, DAY * 3, DAY * 2, DAY,
  HOUR * 12, HOUR * 6, HOUR * 3, HOUR * 1.5, HOUR,
  MINUTE30, MINUTE15, MINUTE * 10, MINUTE5, MINUTE * 2, MINUTE,
]

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
      return;
    }

    this.axis.labels.clear();

    const { main: screenSize } = this.axis.screenSize;
    const labelSize = this.maxLabelSize.main;
    const labelsCount = screenSize / (2 * labelSize);
    const step = screenSize / labelsCount;
    const zeroPos: number = this.axis.translate(0 as UTCTimestamp);
    const shift = zeroPos % step;

    for (let pos = shift; pos < screenSize; pos += step) {
      const labelInfo: LabelOptions<UTCTimestamp> = this.findLabel(this.axis.revert(pos));
      this.axis.labels.set(this.axis.translate(labelInfo.value), labelInfo.caption);
    }
  }

  private get maxLabelSize(): LogicSize {
    return {
      main: (this.axis.textStyle.fontSize + 4) * 5, // magic from tradingview
      second: this.axis.textStyle.fontSize,
    };
  }

  private findLabel(value: UTCTimestamp): LabelOptions<UTCTimestamp> {
    const goodLookingValue: UTCTimestamp = this.nearest(value);
    const caption = this.getCaption(goodLookingValue);
    const { native } = this.context;

    native.save();
    native.font = makeFont(this.axis.textStyle);
    const size = native.measureText(caption).width;
    native.restore();

    return {
      value: goodLookingValue,
      caption,
      size: {
        main: size,
        second: this.axis.textStyle.fontSize,
      },
    };
  }

  private getCaption(value: UTCTimestamp): string {
    return `${value}`;
  }

  private nearest(value: UTCTimestamp): UTCTimestamp {
    return value; // todo
  }
}
