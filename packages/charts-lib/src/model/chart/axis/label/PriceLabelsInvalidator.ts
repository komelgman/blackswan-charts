import { computed, watch } from 'vue';
import { makeFont } from '@/model/misc/function.makeFont';
import AbstractInvalidator from '@/model/chart/axis/label/AbstractInvalidator';
import type { PriceAxis } from '@/model/chart/axis/PriceAxis';
import type { Label } from '@/model/chart/axis/label/Label';
import { nicePriceStep } from '@/model/chart/axis/scaling/price-ticks';

/** Scales choose values/formatting; the axis adapter enforces pixel spacing. */
export default class PriceLabelsInvalidator extends AbstractInvalidator {
  private readonly widths = new Map<string, number>();
  private measuredWith?: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  private font = '';
  public constructor(public readonly axis: PriceAxis) {
    super();
    watch([
      axis.scale, axis.range, axis.inverted, axis.textStyle, axis.referencePrice,
      computed(() => axis.screenSize.main),
    ], () => this.invalidate());
  }

  public invalidate(): void {
    const { axis } = this;
    const size = axis.screenSize.main;
    const spacing = Math.max(1, axis.textStyle.fontSize * 3);
    const halfLabel = axis.textStyle.fontSize / 2;
    const count = Math.floor(size / spacing);
    const labels: Label[] = [];
    // Even a one-label panel needs interior candidates: both endpoints may be clipped.
    const values = count < 1 ? [] : axis.tickValues(Math.max(3, count));
    const sorted = values.map(value => ({ value, position: axis.translate(value) }))
      .filter(tick => Number.isFinite(tick.position) && tick.position >= halfLabel && tick.position <= size - halfLabel)
      .sort((a, b) => a.position - b.position);
    const step = values.length > 1
      ? Math.min(...values.slice(1).map((value, i) => Math.abs(value - values[i])).filter(delta => delta > 0))
      : nicePriceStep(axis.range.to - axis.range.from, count);
    const captions = new Set<string>();
    for (const tick of sorted) {
      const caption = axis.formatPrice(tick.value, step);
      // A subpixel rounding error must not remove every other otherwise uniform tick.
      if (captions.has(caption) || (labels.length && tick.position - labels[labels.length - 1][0] < spacing - 0.01)) continue;
      labels.push([tick.position, caption]);
      captions.add(caption);
    }
    let contentWidth = 0;
    const ctx = this.context?.utilityCanvasContext;
    if (ctx) {
      const font = makeFont(axis.textStyle);
      if (ctx !== this.measuredWith || font !== this.font) this.widths.clear();
      this.measuredWith = ctx; this.font = font;
      ctx.save(); ctx.font = font;
      for (const [, caption] of labels) {
        let width = this.widths.get(caption);
        if (width === undefined) {
          width = ctx.measureText(caption).width;
          if (this.widths.size >= 256) this.widths.clear();
          this.widths.set(caption, width);
        }
        contentWidth = Math.max(contentWidth, width);
      }
      ctx.restore();
    }
    axis.noHistoryManagedUpdate({ labels, contentWidth });
  }
}
