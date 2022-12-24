import { computed, watch } from 'vue';
import makeFont from '@/misc/make-font';
import AbstractInvalidator from '@/model/axis/label/AbstractInvalidator';
import type { LabelOptions } from '@/model/axis/label/LabelOptions';
import type PriceAxis from '@/model/axis/PriceAxis';
import type { LogicSize, Price } from '@/model/type-defs';

// const SCALES = [0.05, 0.1, 0.2, 0.25, 0.5, 0.8, 1, 2, 5];
export default class PriceLabelsInvalidator extends AbstractInvalidator {
  public readonly axis: PriceAxis;

  constructor(axis: PriceAxis) {
    super();

    this.axis = axis;

    watch([
      axis.scale,
      axis.range,
      axis.textStyle,
      computed(() => axis.fraction),
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
    const logicLabelSize: LogicSize = this.maxLabelSize;
    const labelSize = logicLabelSize.main;
    const labelsCount = screenSize / (3 * labelSize);
    const step = screenSize / labelsCount;
    const zeroPos: number = this.axis.translate(0 as Price);
    const shift = Math.sign(zeroPos) * (zeroPos % step);

    this.axis.update({ contentWidth: { value: logicLabelSize.second } });
    for (let pos = shift; pos < screenSize; pos += step) {
      const labelInfo: LabelOptions<Price> = this.findLabel(this.axis.revert(pos));
      this.axis.labels.set(this.axis.translate(labelInfo.value), labelInfo.caption);
    }
  }

  public get maxLabelSize(): LogicSize {
    // todo: use cache
    const { range } = this.axis;
    const v = Math.abs(range.from) < Math.abs(range.to) ? range.to : range.from;
    return this.findLabel(v).size;
  }

  private findLabel(value: Price): LabelOptions<Price> {
    const goodLookingValue = this.nearest(value);
    const caption = this.getCaption(goodLookingValue);

    if (this.context === undefined) {
      console.warn('this.context === undefined');
    }

    let size = -1;
    if (this.context !== undefined) {
      const { native } = this.context;
      native.save();
      native.font = makeFont(this.axis.textStyle);
      size = native.measureText(caption).width;
      native.restore();
    }

    return {
      value: goodLookingValue,
      caption,
      size: {
        main: this.axis.textStyle.fontSize,
        second: size,
      },
    };
  }

  private nearest(value: Price): Price {
    return Number.parseFloat(value.toPrecision(3)) as Price;
  }

  private getCaption(value: Price): string {
    const { fraction } = this.axis;
    return value.toLocaleString(undefined, {
      minimumFractionDigits: fraction,
      maximumFractionDigits: fraction,
    });
  }
}
