import { computed, markRaw, reactive, toRaw } from 'vue';
import { clone, PostConstruct, type EntityId, type Wrapped } from '@blackswan/foundation';
import Axis from '@/model/chart/axis/Axis';
import { type AxisOptions, ControlMode, ZoomType } from '@/model/chart/axis/types';
import type PriceAxisScale from '@/model/chart/axis/scaling/PriceAxisScale';
import { formatPriceNumber, linearPriceTicks, nearestPriceStep, nicePriceStep } from '@/model/chart/axis/scaling/price-ticks';
import type { TextStyle } from '@/model/chart/types/styles';
import type { Price, Range } from '@/model/chart/types';
import type { HistoricalTransactionManager } from '@/model/history';
import { UpdatePriceAxisInverted, UpdatePriceAxisScale } from '@/model/chart/axis/incidents';
import { PriceScales } from '@/model/chart/axis/scaling/PriceAxisScale';

export declare type InvertedValue = 1 | -1;
export declare type Inverted = Wrapped<InvertedValue>;

export interface PriceAxisOptions extends AxisOptions<Price> {
  scale: keyof typeof PriceScales;
  inverted: boolean;
  contentWidth: number;
  priority: number;
}

@PostConstruct
export class PriceAxis extends Axis<Price, PriceAxisOptions> {
  public readonly priority: number;
  public readonly availableScales: Readonly<Record<string, PriceAxisScale>>;
  public readonly referencePrice: Wrapped<Price | undefined> = reactive({ value: undefined });
  private cache!: [virtualFrom: number, scaleK: number, unscaleK: number, virtualSize: number];
  private fractionValue: number = 0;

  private scaleValue: PriceAxisScale;
  private invertedValue: Inverted;
  private contentWidthValue: Wrapped<number> = { value: -1 };

  public constructor(
    id: EntityId,
    historicalTransactionManager: HistoricalTransactionManager,
    textStyle: TextStyle,
    priority: number,
    scales: Readonly<Record<string, PriceAxisScale>> = PriceScales,
  ) {
    super(`${id}-price`, historicalTransactionManager, textStyle);
    this.availableScales = scales;
    this.scaleValue = reactive({ ...scales.regular, func: markRaw(scales.regular.func) });
    this.invertedValue = reactive(clone({ value: -1 }));
    this.priority = priority;
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
    this.resolveScale(value);
    if (value === this.scale.id) return;
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

  public noHistoryManagedUpdate(options: Partial<PriceAxisOptions>): void {
    const scale = options.scale === undefined ? undefined : this.resolveScale(options.scale);
    super.noHistoryManagedUpdate(options);

    if (options.inverted !== undefined) {
      Object.assign(this.invertedValue, { value: options.inverted ? 1 : -1 });
    }

    if (options.contentWidth !== undefined) {
      Object.assign(this.contentWidthValue, { value: options.contentWidth });
    }

    if (scale) {
      Object.assign(this.scaleValue, { ticks: undefined, format: undefined, ...scale, func: markRaw(scale.func) });
    }

    if (options.range !== undefined) {
      this.invalidateFraction();
    }

    if (options.range || options.scale || options.screenSize) {
      this.invalidateCache();
    }
  }

  private resolveScale(id: string): PriceAxisScale {
    const scale = Object.prototype.hasOwnProperty.call(this.availableScales, id) ? this.availableScales[id] : undefined;
    if (!scale) throw new Error(`Unknown price scale: ${id}`);
    return scale;
  }

  public tickValues(count: number): Price[] {
    return (this.scale.ticks ?? linearPriceTicks)(this.range, count, { referencePrice: this.referencePrice.value });
  }

  public formatPrice(value: Price, step = nicePriceStep(this.range.to - this.range.from, 100)): string {
    return this.scale.format
      ? this.scale.format(value, step, { referencePrice: this.referencePrice.value })
      : formatPriceNumber(value, nearestPriceStep(step));
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

  private calcRangeScalingParams(range: Range<Price>): typeof this.cache {
    const virtualFrom = this.scale.func.translate(range.from);
    const virtualTo = this.scale.func.translate(range.to);
    const virtualSize = virtualTo - virtualFrom;
    const scaleK = this.screenSize.main / virtualSize;
    const unscaleK = virtualSize / this.screenSize.main;

    return [virtualFrom, scaleK, unscaleK, virtualSize];
  }

  public translate(value: Price): number {
    const [virtualFrom, scaleK, , virtualSize] = this.cache;
    const delta = this.scale.func.translate(value) - virtualFrom;
    // Tiny ranges can overflow the cached multiplier even though the coordinate is finite.
    const translated = Number.isFinite(scaleK) ? delta * scaleK : delta / virtualSize * this.screenSize.main;
    return this.inverted.value < 0
      ? this.screenSize.main - translated
      : translated;
  }

  public translateBatchInPlace(values: any[][], indicies: number[]): void {
    const [virtualFrom, scaleK, , virtualSize] = this.cache;
    const scaleFunc = toRaw(this.scale.func);
    const { main: screenSize } = this.screenSize;
    const inverted = this.inverted.value < 0;
    const finiteScale = Number.isFinite(scaleK);

    for (let i = 0; i < values.length; ++i) {
      const value = values[i];
      for (let j = 0; j < indicies.length; j++) {
        const index = indicies[j];
        const delta = scaleFunc.translate(value[index] as Price) - virtualFrom;
        const translated = finiteScale ? delta * scaleK : delta / virtualSize * screenSize;
        value[index] = inverted ? screenSize - translated : translated;
      }
    }
  }

  public revert(screenPos: number): Price {
    const [virtualFrom, , unscaleK, virtualSize] = this.cache;
    const pos = this.inverted.value < 0
      ? this.screenSize.main - screenPos
      : screenPos;
    return this.scale.func.revert((unscaleK === 0 ? pos / this.screenSize.main * virtualSize : pos * unscaleK) + virtualFrom);
  }

  // shift price value in percent of axis screen size
  public scaledShift(value: Price, shift: number, range: Range<Price> | undefined = undefined): Price {
    const [virtualFrom, , , virtualSize] = this.calcRangeScalingParams(range || this.range);
    const scaleFunc = this.scale.func;
    const fraction = (scaleFunc.translate(value) - virtualFrom) / virtualSize;
    const shifted = fraction + (this.inverted.value < 0 ? -shift : shift);
    return scaleFunc.revert(shifted * virtualSize + virtualFrom);
  }

  public applyPaddingToRange(range: Range<Price>, fromPading: number, toPadding: number): Range<Price> {
    const [virtualFrom, , , virtualSize] = this.calcRangeScalingParams(range);
    const scaleFunc = this.scale.func;
    const k = 1 / (1 - Math.abs(fromPading) - Math.abs(toPadding));
    return {
      from: scaleFunc.revert(virtualFrom + fromPading * k * virtualSize),
      to: scaleFunc.revert(virtualFrom + (1 + toPadding * k) * virtualSize),
    };
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
      const pivot = this.inverted.value < 0 ? screenSize - screenPivot : screenPivot;

      this.noHistoryManagedUpdate({
        range: {
          from: scalingFunction.revert(virtualFrom + delta * (pivot / screenSize)),
          to: scalingFunction.revert(virtualTo - delta * ((screenSize - pivot) / screenSize)),
        },
      });
    });
  }

  private ajustRangeWhenMovedManually(screenDelta: number): void {
    this.updateRange(() => {
      const { main: screenSize } = this.screenSize;
      const top = this.revert(screenDelta);
      const bottom = this.revert(screenSize + screenDelta);

      this.noHistoryManagedUpdate({
        range: {
          from: Math.min(top, bottom) as Price,
          to: Math.max(top, bottom) as Price,
        },
      });
    });
  }
}
