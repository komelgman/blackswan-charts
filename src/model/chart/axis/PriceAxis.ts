import { computed, reactive, toRaw } from 'vue';
import { clone } from '@/misc/object.clone';
import Axis from '@/model/chart/axis/Axis';
import { type AxisOptions, ControlMode, ZoomType } from '@/model/chart/axis/types';
import type PriceAxisScale from '@/model/chart/axis/scaling/PriceAxisScale';
import type { TextStyle } from '@/model/chart/types/styles';
import type { EntityId } from '@/model/tools/IdBuilder';
import type { Price, Range } from '@/model/chart/types';
import type { Wrapped } from '@/model/type-defs';
import { PostConstruct } from '@/model/type-defs/decorators';
import type { HistoricalTransactionManager } from '@/model/history';
import { UpdatePriceAxisInverted, UpdatePriceAxisScale } from '@/model/chart/axis/incidents';
import { PriceScales } from '@/model/chart/axis/scaling/PriceAxisScale';

export declare type InvertedValue = 1 | -1;
export declare type Inverted = Wrapped<InvertedValue>;

export interface PriceAxisOptions extends AxisOptions<Price> {
  scale?: keyof typeof PriceScales;
  inverted?: boolean;
  contentWidth?: number;
}

@PostConstruct
export class PriceAxis extends Axis<Price, PriceAxisOptions> {
  private cache!: [virtualFrom: number, scaleK: number, unscaleK: number];
  private fractionValue: number = 0;

  private scaleValue: PriceAxisScale;
  private invertedValue: Inverted;
  private contentWidthValue: Wrapped<number> = { value: -1 };

  public constructor(
    id: EntityId,
    historicalTransactionManager: HistoricalTransactionManager,
    textStyle: TextStyle,
  ) {
    super(`${id}-price`, historicalTransactionManager, textStyle);
    this.scaleValue = reactive(clone(PriceScales.regular));
    this.invertedValue = reactive(clone({ value: -1 }));
  }

  public postConstruct(): void {
    super.postConstruct();
    this.invalidateFraction();
    this.invalidateCache();
  }

  public get inverted(): Readonly<Inverted> {
    return this.invertedValue;
  }

  public invert(): void {
    this.transactionManager.transact({
      protocolOptions: { protocolTitle: 'price-axis-update-inverted' },
      incident: new UpdatePriceAxisInverted({
        axis: this,
        inverted: this.inverted.value < 0,
      }),
    });
  }

  public get scale(): Readonly<PriceAxisScale> {
    return this.scaleValue;
  }

  public set scale(value: keyof typeof PriceScales) {
    this.transactionManager.transact({
      protocolOptions: { protocolTitle: 'price-axis-update-scale' },
      incident: new UpdatePriceAxisScale({
        axis: this,
        scale: value,
      }),
    });
  }

  public get fraction(): number {
    return this.fractionValue;
  }

  public get contentWidth(): Readonly<Wrapped<number>> {
    return this.contentWidthValue;
  }

  public noHistoryManagedUpdate(options: PriceAxisOptions): void {
    super.noHistoryManagedUpdate(options);

    if (options.inverted !== undefined) {
      Object.assign(this.invertedValue, { value: options.inverted ? 1 : -1 });
    }

    if (options.contentWidth !== undefined) {
      Object.assign(this.contentWidthValue, { value: options.contentWidth });
    }

    if (options.scale !== undefined) {
      Object.assign(this.scaleValue, clone(PriceScales[options.scale]));
    }

    if (options.range !== undefined) {
      this.invalidateFraction();
    }

    if (options.range || options.scale || options.screenSize?.main) {
      this.invalidateCache();
    }
  }

  protected get preferredRange(): Readonly<Wrapped<Range<Price> | undefined>> {
    return computed(() => this.primaryEntry.preferredPriceRange).value;
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
    this.cache = this.calcRangeScalingParams(this.range);
  }

  private calcRangeScalingParams(range: Range<Price>): [virtualFrom: number, scaleK: number, unscaleK: number] {
    const virtualFrom = this.scale.func.translate(range.from);
    const virtualTo = this.scale.func.translate(range.to);
    const virtualSize = virtualTo - virtualFrom;
    const scaleK = this.screenSize.main / virtualSize;
    const unscaleK = virtualSize / this.screenSize.main;

    return [virtualFrom, scaleK, unscaleK];
  }

  public translate(value: Price): number {
    const [virtualFrom, scaleK] = this.cache;
    return (this.scale.func.translate(value) - virtualFrom) * scaleK;
  }

  public translateBatchInPlace(values: any[][], indicies: number[]): void {
    const [virtualFrom, scaleK] = this.cache;
    const scaleFunc = toRaw(this.scale.func);

    for (let i = 0; i < values.length; ++i) {
      const value = values[i];
      for (let j = 0; j < indicies.length; j++) {
        const index = indicies[j];
        value[index] = (scaleFunc.translate(value[index] as Price) - virtualFrom) * scaleK;
      }
    }
  }

  public revert(screenPos: number): Price {
    const [virtualFrom, , unscaleK] = this.cache;
    return this.scale.func.revert(screenPos * unscaleK + virtualFrom);
  }

  // shift price value in percent of axis screen size
  public scaledShift(value: Price, shift: number, range: Range<Price> | undefined = undefined): Price {
    const [virtualFrom, scaleK, unscaleK] = this.calcRangeScalingParams(range || this.range);
    const scaleFunc = this.scale.func;

    const translated = (scaleFunc.translate(value) - virtualFrom) * scaleK;
    const shifted = translated + shift * this.screenSize.main;

    return scaleFunc.revert(shifted * unscaleK + virtualFrom);
  }

  public applyPaddingToRange(range: Range<Price>, fromPading: number, toPadding: number): Range<Price> {
    const [virtualFrom, scaleK, unscaleK] = this.calcRangeScalingParams(range);
    const scaleFunc = this.scale.func;

    const k = this.screenSize.main / (1 - Math.abs(fromPading) - Math.abs(toPadding));
    const shiftedFrom = (scaleFunc.translate(range.from) - virtualFrom) * scaleK + fromPading * k;
    const shiftedTo = (scaleFunc.translate(range.to) - virtualFrom) * scaleK + toPadding * k;

    return { from: scaleFunc.revert(shiftedFrom * unscaleK + virtualFrom), to: scaleFunc.revert(shiftedTo * unscaleK + virtualFrom) };
  }

  protected ajustStateWhenZoomedManually(screenPivot: number, screenDelta: number): void {
    this.ajustControlModeWhenChangedManually();
    this.ajustRangeWhenZoomedManually(screenPivot, screenDelta);
  }

  protected ajustStateWhenMovedManually(screenDelta: number): void {
    this.ajustControlModeWhenChangedManually();
    this.ajustRangeWhenMovedManually(screenDelta);
  }

  private ajustControlModeWhenChangedManually(): void {
    if (this.controlMode.value === ControlMode.AUTO) {
      this.controlMode = ControlMode.MANUAL;
    }
  }

  private ajustRangeWhenZoomedManually(screenPivot: number, screenDelta: number) {
    this.updateRange(() => {
      const { main: screenSize } = this.screenSize;
      const { from, to } = this.range;
      const { func: scalingFunction } = this.scale;

      const virtualFrom = scalingFunction.translate(from);
      const virtualTo = scalingFunction.translate(to);
      const virtualSize = virtualTo - virtualFrom;

      const zoomType: ZoomType = screenDelta > 0 ? ZoomType.IN : ZoomType.OUT;
      const delta = virtualSize * zoomType.valueOf();

      this.noHistoryManagedUpdate({
        range: {
          from: scalingFunction.revert(virtualFrom + delta * (screenPivot / screenSize)),
          to: scalingFunction.revert(virtualTo - delta * ((screenSize - screenPivot) / screenSize)),
        },
      });
    });
  }

  private ajustRangeWhenMovedManually(screenDelta: number): void {
    this.updateRange(() => {
      const { main: screenSize } = this.screenSize;
      const { from, to } = this.range;
      const { func: scalingFunction } = this.scale;

      const virtualFrom = scalingFunction.translate(from);
      const virtualTo = scalingFunction.translate(to);
      const virtualSize = virtualTo - virtualFrom;
      const unscaleK = virtualSize / screenSize;

      const revert = (screenPos: number): Price => scalingFunction.revert(virtualFrom + unscaleK * screenPos);

      this.noHistoryManagedUpdate({
        range: {
          from: revert(this.inverted.value * screenDelta),
          to: revert(screenSize + this.inverted.value * screenDelta),
        },
      });
    });
  }
}
