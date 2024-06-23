import Layer from '@/components/layered-canvas/model/Layer';
import makeFont from '@/misc/make-font';
import type { InvertedValue } from '@/model/chart/axis/PriceAxis';
import { PRICE_LABEL_PADDING } from '@/model/chart/layers/PriceAxisLabelsLayer';
import type Viewport from '@/model/chart/viewport/Viewport';
import {
  DataSourceChangeEventReason,
  type DataSourceChangeEventListener,
  type DataSourceChangeEventsMap,
} from '@/model/datasource/events';
import type { DataSourceEntry } from '@/model/datasource/types';
import type { Predicate } from '@/model/type-defs';
import { toRaw, watch } from 'vue';

export default class PriceAxisMarksLayer extends Layer {
  private readonly viewport: Viewport;

  constructor(viewport: Viewport) {
    super();

    this.viewport = viewport;

    watch([
      this.viewport.priceAxis.textStyle,
      this.viewport.priceAxis.inverted,
    ], () => {
      this.invalid = true;
    });
  }

  public installListeners(): void {
    this.viewport.dataSource.addChangeEventListener(this.dataSourceChangeEventListener);
  }

  public uninstallListeners(): void {
    this.viewport.dataSource.removeChangeEventListener(this.dataSourceChangeEventListener);
  }

  private dataSourceChangeEventListener: DataSourceChangeEventListener = (events: DataSourceChangeEventsMap): void => {
    const { CacheInvalidated, RemoveEntry } = DataSourceChangeEventReason;
    if (events.has(CacheInvalidated) || events.has(RemoveEntry)) {
      this.invalid = true;
    }
  };

  protected render(native: CanvasRenderingContext2D, width: number, height: number): void {
    const inverted: InvertedValue = this.viewport.priceAxis.inverted.value;
    const { textStyle } = this.viewport.priceAxis;
    const half = textStyle.fontSize / 2;

    if (inverted < 0) {
      native.translate(0, height);
    }

    native.textBaseline = 'middle';
    native.textAlign = 'end';
    native.font = makeFont(textStyle);

    const validMarks: Predicate<DataSourceEntry> = ({ descriptor, mark}): boolean => {
      const { options } = descriptor;

      return options.type === 'HLine'
        && options.visible
        && !!descriptor.valid
        && !!descriptor.visibleInViewport
        && mark !== undefined;
    };

    const x = width - PRICE_LABEL_PADDING;
    for (const { descriptor, drawing, mark } of toRaw(this.viewport.dataSource).filtered(validMarks)) {
      if (mark === undefined || drawing === undefined) {
        continue;
      }

      const y: number = inverted * mark.screenPos;

      native.beginPath();
      native.lineWidth = 1;
      native.fillStyle = descriptor.options.data.style.color;
      native.rect(0, y - half - 3, width, textStyle.fontSize + 4);
      native.fill();

      native.fillStyle = mark.textColor;
      native.fillText(mark.text, x, y);
    }
  }
}
