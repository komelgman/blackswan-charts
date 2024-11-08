import { watch } from 'vue';
import Layer from '@/components/layered-canvas/model/Layer';
import makeFont from '@/misc/make-font';
import type { InvertedValue, PriceAxis } from '@/model/chart/axis/PriceAxis';
import { PRICE_LABEL_PADDING } from '@/model/chart/layers/PriceAxisLabelsLayer';
import {
  DataSourceChangeEventReason,
  type DataSourceChangeEventListener,
  type DataSourceChangeEventsMap,
} from '@/model/datasource/events';
import type { DataSourceEntry } from '@/model/datasource/types';
import type { Predicate } from '@/model/type-defs';
import type DataSource from '@/model/datasource/DataSource';

export default class PriceAxisMarksLayer extends Layer {
  private readonly dataSource: DataSource;
  private readonly priceAxis: PriceAxis;

  constructor(dataSource: DataSource, priceAxis: PriceAxis) {
    super();

    this.dataSource = dataSource;
    this.priceAxis = priceAxis;

    watch([
      this.priceAxis.textStyle,
      this.priceAxis.inverted,
    ], () => {
      this.invalid = true;
    });
  }

  public installListeners(): void {
    this.dataSource.addChangeEventListener(this.dataSourceChangeEventListener);
  }

  public uninstallListeners(): void {
    this.dataSource.removeChangeEventListener(this.dataSourceChangeEventListener);
  }

  private dataSourceChangeEventListener: DataSourceChangeEventListener = (events: DataSourceChangeEventsMap): void => {
    const { CacheInvalidated, RemoveEntry } = DataSourceChangeEventReason;
    if (events.has(CacheInvalidated) || events.has(RemoveEntry)) {
      this.invalid = true;
    }
  };

  protected render(native: CanvasRenderingContext2D, width: number, height: number): void {
    const inverted: InvertedValue = this.priceAxis.inverted.value;
    const { textStyle } = this.priceAxis;
    const half = textStyle.fontSize / 2;

    if (inverted < 0) {
      native.translate(0, height);
    }

    native.textBaseline = 'middle';
    native.textAlign = 'end';
    native.font = makeFont(textStyle);

    const containValidMarks: Predicate<DataSourceEntry> = ({ descriptor, drawing, mark }): boolean => {
      const { options } = descriptor;

      // todo: marks
      return mark !== undefined
        && mark.type === 'PriceMark'
        && options.visible
        && drawing !== undefined
        && !!descriptor.valid
        && !!descriptor.visibleInViewport;
    };

    const x = width - PRICE_LABEL_PADDING;
    for (const { mark } of this.dataSource.filtered(containValidMarks)) {
      if (mark === undefined) {
        continue;
      }

      const y: number = inverted * mark.screenPos;

      native.beginPath();
      native.lineWidth = 1;
      native.fillStyle = mark.bgColor;
      native.rect(0, y - half - 3, width, textStyle.fontSize + 4);
      native.fill();

      native.fillStyle = mark.textColor;
      native.fillText(mark.text, x, y);
    }
  }
}
