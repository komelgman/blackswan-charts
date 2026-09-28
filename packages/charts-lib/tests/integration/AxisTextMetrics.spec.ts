import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { effectScope, type EffectScope } from 'vue';
import type { LayerContext } from '@blackswan/layered-canvas/model';
import PriceLabelsInvalidator from '@/model/chart/axis/label/PriceLabelsInvalidator';
import { createChartHarness } from '../support/chartHarness';
import { RecordingCanvas } from '../support/RecordingCanvas';

describe('axis layout with supplied text metrics', () => {
  let h: ReturnType<typeof createChartHarness>;
  let scope: EffectScope;
  beforeEach(async () => {
    h = createChartHarness({ render: false }); h.addPane('main'); await h.settle();
    scope = effectScope();
  });
  afterEach(() => { scope.stop(); h.dispose(); });

  function context(multiplier: number): LayerContext {
    const canvas = new RecordingCanvas((text, font) => text.length * Number(font.match(/([\d.]+)px/)![1]) * multiplier);
    return { mainCanvas: {} as HTMLCanvasElement, utilityCanvasContext: canvas.asContext(), width: 60, height: 600, dpr: 1 };
  }

  it('remeasures cached labels after font or measurement context changes', async () => {
    const axis = h.chart.paneModel('main').priceAxis;
    const invalidator = scope.run(() => new PriceLabelsInvalidator(axis))!;
    invalidator.context = context(1);
    const initial = axis.contentWidth.value;
    const count = axis.labels.value.length;
    expect(initial).toBeGreaterThan(0);
    h.chart.updateStyle({ textStyle: { fontSize: axis.textStyle.fontSize * 2 } });
    await h.settle();
    expect(axis.contentWidth.value).toBe(initial * 2);
    expect(axis.labels.value.length).toBeLessThan(count);
    invalidator.context = context(3);
    expect(axis.contentWidth.value).toBe(initial * 6);
    h.chart.undo(); await h.settle();
    expect(axis.contentWidth.value).toBe(initial * 3);
    expect(axis.labels.value.length).toBe(count);
  });
});
