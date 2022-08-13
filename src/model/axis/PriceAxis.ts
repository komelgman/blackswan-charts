import { Point, Price, Wrapped } from '@/model/type-defs';
import Axis from '@/model/axis/Axis';
import Reactive, { HasPostConstruct } from '@/misc/reactive-decorator';
import { computed, reactive, watch } from 'vue';
import { MenuItem } from '@/components/context-menu/ContextMenuOptions';
import { ZoomType } from '@/model/axis/scaling/ScalingFunction';
import PriceScale, { PriceScales } from '@/model/axis/scaling/PriceScale';
import { clone } from '@/misc/strict-type-checks';
import { TextStyle } from '@/model/ChartStyle';

export declare type InvertedValue = 1 | -1;
export declare type Inverted = Wrapped<InvertedValue>;

@Reactive
export default class PriceAxis extends Axis<Price> implements HasPostConstruct {
  public scale: PriceScale;
  public inverted: Inverted; // watch doesn't work with scalar
  public contentWidth: Wrapped<number> = { value: -1 };
  public fraction: number = 0;
  private cache!: [/* virtualFrom */ number, /* scaleK */ number, /* unscaleK */ number];

  public constructor(textStyle: TextStyle, scale: PriceScale, inverted: Inverted) {
    super(textStyle);
    this.scale = reactive(clone(scale));
    this.inverted = reactive(clone(inverted));
  }

  // todo: extract to class
  public contextmenu(pos: Point): MenuItem[] {
    const inverted: boolean = this.inverted.value === 1;
    const isRegularScale: boolean = this.scale.title === 'Regular';
    const isLog10Scale: boolean = this.scale.title === 'Log(10)';

    return [
      {
        type: 'checkbox',
        title: 'Invert scale',
        checked: inverted,
        onclick: this.invert.bind(this),
      },
      {
        type: 'checkbox',
        title: 'Scale - Regular',
        checked: isRegularScale,
        onclick: () => {
          console.log('Scale - Regular');
          Object.assign(this.scale, reactive(clone(PriceScales.regular)))
        },
      },
      {
        type: 'checkbox',
        title: 'Scale - Log(10)',
        checked: isLog10Scale,
        onclick: () => {
          console.log('Scale - Log(10)');
          Object.assign(this.scale, reactive(clone(PriceScales.log10)));
        },
      },
    ];
  }

  public postConstruct(): void {
    watch(this.range, this.invalidateFraction.bind(this), { immediate: true });
    watch([
      this.range,
      this.scale,
      computed(() => this.screenSize.main),
    ], this.updateCache.bind(this), { immediate: true });
  }

  private invalidateFraction(): void {
    this.fraction = this.calcFraction();
  }

  // todo: extract to utility function
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

  private invert(): void {
    this.inverted.value = this.inverted.value > 0 ? -1 : 1;
  }

  private updateCache(): void {
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

  public zoom(screenPivot: number, screenDelta: number): void {
    const { main: screenSize } = this.screenSize;
    const { from, to } = this.range;
    const { func: scalingFunction } = this.scale;

    const virtualFrom = scalingFunction.translate(from);
    const virtualTo = scalingFunction.translate(to);
    const virtualSize = virtualTo - virtualFrom;

    const zoomType: ZoomType = screenDelta > 0 ? ZoomType.IN : ZoomType.OUT;
    const delta = virtualSize * zoomType.valueOf();

    this.range.from = scalingFunction.revert(virtualFrom + delta * (screenPivot / screenSize));
    this.range.to = scalingFunction.revert(virtualTo - delta * ((screenSize - screenPivot) / screenSize));
  }

  public move(screenDelta: number): void {
    const { main: screenSize } = this.screenSize;
    const { from, to } = this.range;
    const { func: scalingFunction } = this.scale;

    const virtualFrom = scalingFunction.translate(from);
    const virtualTo = scalingFunction.translate(to);
    const virtualSize = virtualTo - virtualFrom;
    const unscaleK = virtualSize / screenSize;

    const revert = (screenPos: number): Price => scalingFunction.revert(virtualFrom + unscaleK * screenPos);

    this.range.from = revert(this.inverted.value * screenDelta);
    this.range.to = revert(screenSize + this.inverted.value * screenDelta);
  }
}
