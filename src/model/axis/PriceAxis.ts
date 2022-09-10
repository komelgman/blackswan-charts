import Reactive, { HasPostConstruct } from '@/misc/reactive-decorator';
import { clone } from '@/misc/strict-type-checks';
import Axis from '@/model/axis/Axis';
import AxisOptions from '@/model/axis/AxisOptions';
import PriceScale from '@/model/axis/scaling/PriceScale';
import { ZoomType } from '@/model/axis/scaling/ScalingFunction';
import { TextStyle } from '@/model/ChartStyle';
import TVAClerk from '@/model/history/TVAClerk';
import { Price, Wrapped } from '@/model/type-defs';
import { reactive } from 'vue';

export declare type InvertedValue = 1 | -1;
export declare type Inverted = Wrapped<InvertedValue>;

export interface PriceAxisOptions extends AxisOptions<Price> {
  scale?: PriceScale;
  inverted?: Inverted;
  contentWidth?: Wrapped<number>;
}

@Reactive
export default class PriceAxis extends Axis<Price, PriceAxisOptions> implements HasPostConstruct {
  private cache!: [/* virtualFrom */ number, /* scaleK */ number, /* unscaleK */ number];
  private fractionValue: number = 0;

  protected scaleValue: PriceScale;
  protected invertedValue: Inverted;
  protected contentWidthValue: Wrapped<number> = { value: -1 }; // watch doesn't work with scalar

  public constructor(tvaClerk: TVAClerk, textStyle: TextStyle, scale: PriceScale, inverted: Inverted) {
    super(tvaClerk, textStyle);
    this.scaleValue = reactive(clone(scale));
    this.invertedValue = reactive(clone(inverted));
  }

  public postConstruct(): void {
    this.invalidateFraction();
    this.invalidateCache();
  }

  public get inverted(): Readonly<Inverted> {
    return this.invertedValue;
  }

  public get scale(): Readonly<PriceScale> {
    return this.scaleValue;
  }

  public get fraction(): number {
    return this.fractionValue;
  }

  public get contentWidth(): Readonly<Wrapped<number>> {
    return this.contentWidthValue;
  }

  public update(options: PriceAxisOptions): void {
    super.update(options);

    if (options.inverted) {
      Object.assign(this.invertedValue, { ...options.inverted });
    }

    if (options.contentWidth) {
      Object.assign(this.contentWidthValue, { ...options.contentWidth });
    }

    if (options.scale) {
      Object.assign(this.scaleValue, clone(options.scale));
    }

    if (options.range) {
      this.invalidateFraction();
    }

    if (options.range || options.scale || options.screenSize?.main) {
      this.invalidateCache();
    }
  }

  private invalidateFraction(): void {
    this.fractionValue = this.calcFraction();
  }

  private calcFraction(): number {
    const { range } = this;

    const { max, min, abs, log10, round } = Math;
    const maxValue = round(log10(max(abs(range.from), abs(range.to))));
    let minValue = round(log10(min(abs(range.from), abs(range.to))));

    if (maxValue - minValue > 5) {
      minValue = maxValue;
    }

    const result = abs(min(minValue - 5, 0));
    if (range.from < 0 && range.to > 0) {
      return max(result, 3);
    }

    return result;
  }

  private invalidateCache(): void {
    // console.debug('price axis update cache');

    const virtualFrom = this.scale.func.translate(this.range.from);
    const virtualTo = this.scale.func.translate(this.range.to);
    const virtualSize = virtualTo - virtualFrom;
    const scaleK = this.screenSize.main / virtualSize;
    const unscaleK = virtualSize / this.screenSize.main;

    this.cache = [virtualFrom, scaleK, unscaleK];
  }

  public translate(value: Price): number {
    const [virtualFrom, scaleK, _] = this.cache;
    return (this.scale.func.translate(value) - virtualFrom) * scaleK;
  }

  public revert(screenPos: number): Price {
    const [virtualFrom, _, unscaleK] = this.cache;
    return this.scale.func.revert(screenPos * unscaleK + virtualFrom);
  }

  protected updateZoom(screenPivot: number, screenDelta: number): void {
    const { main: screenSize } = this.screenSize;
    const { from, to } = this.range;
    const { func: scalingFunction } = this.scale;

    const virtualFrom = scalingFunction.translate(from);
    const virtualTo = scalingFunction.translate(to);
    const virtualSize = virtualTo - virtualFrom;

    const zoomType: ZoomType = screenDelta > 0 ? ZoomType.IN : ZoomType.OUT;
    const delta = virtualSize * zoomType.valueOf();

    this.update({
      range: {
        from: scalingFunction.revert(virtualFrom + delta * (screenPivot / screenSize)),
        to: scalingFunction.revert(virtualTo - delta * ((screenSize - screenPivot) / screenSize)),
      },
    });
  }

  protected updatePosition(screenDelta: number): void {
    const { main: screenSize } = this.screenSize;
    const { from, to } = this.range;
    const { func: scalingFunction } = this.scale;

    const virtualFrom = scalingFunction.translate(from);
    const virtualTo = scalingFunction.translate(to);
    const virtualSize = virtualTo - virtualFrom;
    const unscaleK = virtualSize / screenSize;

    const revert = (screenPos: number): Price => scalingFunction.revert(virtualFrom + unscaleK * screenPos);

    this.update({
      range: {
        from: revert(this.inverted.value * screenDelta),
        to: revert(screenSize + this.inverted.value * screenDelta),
      },
    });
  }
}
