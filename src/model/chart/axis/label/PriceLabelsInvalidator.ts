import { computed, toRaw, watch } from 'vue';
import { makeFont } from '@/model/misc/function.makeFont';
import AbstractInvalidator from '@/model/chart/axis/label/AbstractInvalidator';
import type { LabelOptions } from '@/model/chart/axis/label/LabelOptions';
import type { PriceAxis } from '@/model/chart/axis/PriceAxis';
import type { LogicSize, Price, Range } from '@/model/chart/types';
import { Cache } from '@/model/misc/tools';
import type { Label } from '@/model/chart/axis/label/Label';

// todo: refactor code to get more good loocking values
// const SCALES = [0.05, 0.1, 0.2, 0.25, 0.5, 0.8, 1, 2, 5];
export default class PriceLabelsInvalidator extends AbstractInvalidator {
  public readonly axis: PriceAxis;

  private readonly labelsCache: Cache<Price, LabelOptions<Price>> = new Cache();
  private currentFont: string = '';
  private currentFontSize: number = 0;
  private currentRange: Range<Price> = { from: 0, to: 0 } as Range<Price>;
  private currentFraction: number = 0;

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
    const labels: Label[] = [];

    const axis = toRaw(this.axis);
    this.currentFont = makeFont(axis.textStyle);
    this.currentRange = axis.range;
    this.currentFontSize = axis.textStyle.fontSize;
    this.currentFraction = axis.fraction;

    const { main: screenSize } = this.axis.screenSize;
    const logicLabelSize: LogicSize = this.maxLabelSize;
    const labelSize = logicLabelSize.main;
    const labelsCount = screenSize / (3 * labelSize);
    const step = screenSize / labelsCount;
    const zeroPos: number = this.axis.translate(0 as Price);
    const shift = Math.sign(zeroPos) * (zeroPos % step);

    for (let pos = shift; pos < screenSize; pos += step) {
      const labelInfo: LabelOptions<Price> = this.findLabel(this.axis.revert(pos));
      labels.push([this.axis.translate(labelInfo.value), labelInfo.caption]);
    }

    this.axis.noHistoryManagedUpdate({ contentWidth: logicLabelSize.second, labels });
  }

  private get maxLabelSize(): LogicSize {
    const range = this.currentRange;
    const v = Math.abs(range.from) < Math.abs(range.to) ? range.to : range.from;
    return this.findLabel(v).size;
  }

  private findLabel(value: Price): LabelOptions<Price> {
    return this.labelsCache.getValue(value, (price) => {
      const goodLookingValue = this.nearest(price);
      const caption = this.getCaption(goodLookingValue);

      let size = -1;
      if (this.context !== undefined) {
        const { utilityCanvasContext: utilityContext } = this.context;
        utilityContext.save();
        utilityContext.font = this.currentFont;
        size = utilityContext.measureText(caption).width;
        utilityContext.restore();
      }

      return {
        value: goodLookingValue,
        caption,
        size: {
          main: this.currentFontSize,
          second: size,
        },
      };
    });
  }

  private nearest(value: Price): Price {
    return Number.parseFloat(value.toPrecision(3)) as Price;
  }

  private getCaption(value: Price): string {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: this.currentFraction,
      maximumFractionDigits: this.currentFraction,
    });
  }
}
