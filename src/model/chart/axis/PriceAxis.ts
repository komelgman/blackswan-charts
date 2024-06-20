import type { TextStyle } from '@/model/TextStyle';
import { reactive } from 'vue';
import UpdatePriceAxisInverted from '@/model/chart/axis/incidents/UpdatePriceAxisInverted';
import UpdatePriceAxisScale from '@/model/chart/axis/incidents/UpdatePriceAxisScale';
import type { EntityId } from '@/model/tools/IdBuilder';
import type { HasPostConstruct } from '@/misc/reactive-decorator';
import { clone } from '@/misc/object.clone';
import Axis from '@/model/chart/axis/Axis';
import type AxisOptions from '@/model/chart/axis/AxisOptions';
import { ZoomType } from '@/model/chart/axis/AxisOptions';
import type PriceAxisScale from '@/model/chart/axis/scaling/PriceAxisScale';
import type TVAClerk from '@/model/history/TVAClerk';
import type { Price, Wrapped } from '@/model/type-defs';

export declare type InvertedValue = 1 | -1;
export declare type Inverted = Wrapped<InvertedValue>;

export interface PriceAxisOptions extends AxisOptions<Price> {
  scale?: PriceAxisScale;
  inverted?: boolean;
  contentWidth?: Wrapped<number>;
}

export default class PriceAxis extends Axis<Price, PriceAxisOptions> implements HasPostConstruct {
  private cache!: [/* virtualFrom */ number, /* scaleK */ number, /* unscaleK */ number];
  private fractionValue: number = 0;

  protected scaleValue: PriceAxisScale;
  protected invertedValue: Inverted;
  protected contentWidthValue: Wrapped<number> = { value: -1 }; // watch doesn't work with scalar

  public constructor(id: EntityId, tvaClerk: TVAClerk, textStyle: TextStyle, scale: PriceAxisScale, inverted: Inverted) {
    super(`${id}-price`, tvaClerk, textStyle);
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

  public invert(): void {
    this.tvaClerk.processReport({
      protocolOptions: { incident: 'price-axis-update-inverted' },
      incident: new UpdatePriceAxisInverted({
        axis: this,
        inverted: this.inverted.value < 0,
      }),
      sign: true,
    });
  }

  public get scale(): Readonly<PriceAxisScale> {
    return this.scaleValue;
  }

  public set scale(value: PriceAxisScale) {
    this.tvaClerk.processReport({
      protocolOptions: { incident: 'price-axis-update-scale' },
      incident: new UpdatePriceAxisScale({
        axis: this,
        scale: value,
      }),
      sign: true,
    });
  }

  public get fraction(): number {
    return this.fractionValue;
  }

  public get contentWidth(): Readonly<Wrapped<number>> {
    return this.contentWidthValue;
  }

  public update(options: PriceAxisOptions): void {
    super.update(options);

    if (options.inverted !== undefined) {
      Object.assign(this.invertedValue, { value: options.inverted ? 1 : -1 });
    }

    if (options.contentWidth !== undefined) {
      Object.assign(this.contentWidthValue, { ...options.contentWidth });
    }

    if (options.scale !== undefined) {
      Object.assign(this.scaleValue, clone(options.scale));
    }

    if (options.range !== undefined) {
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
    const virtualFrom = this.scale.func.translate(this.range.from);
    const virtualTo = this.scale.func.translate(this.range.to);
    const virtualSize = virtualTo - virtualFrom;
    const scaleK = this.screenSize.main / virtualSize;
    const unscaleK = virtualSize / this.screenSize.main;

    this.cache = [virtualFrom, scaleK, unscaleK];
  }

  public translate(value: Price): number {
    const [virtualFrom, scaleK] = this.cache;
    return (this.scale.func.translate(value) - virtualFrom) * scaleK;
  }

  public revert(screenPos: number): Price {
    const [virtualFrom, , unscaleK] = this.cache;
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

  protected updateRange(screenDelta: number): void {
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
