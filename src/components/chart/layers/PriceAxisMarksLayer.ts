import Layer from '@/components/layered-canvas/layers/Layer';
import { InvertedValue } from '@/model/axis/PriceAxis';
import { toRaw, watch } from 'vue';
import makeFont from '@/misc/make-font';
import Viewport from '@/model/viewport/Viewport';
import DataSourceChangeEventListener from '@/model/datasource/DataSourceChangeEventListener';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';
import { Predicate } from '@/model/type-defs';
import { DataSourceEntry } from '@/model/datasource/DataSource';
import { PRICE_LABEL_PADDING } from '@/components/chart/layers/PriceAxisLabelsLayer';

export default class PriceAxisMarksLayer extends Layer {
  private readonly viewport: Viewport;

  constructor(viewport: Viewport) {
    super();
    this.viewport = viewport;

    watch([
      this.viewport.priceAxis.textStyle,
      this.viewport.priceAxis.inverted,
    ], () => { this.invalid = true });
  }

  public installListeners(): void {
    this.viewport.dataSource.addChangeEventListener(this.listener.bind(this));
  }

  public uninstallListeners(): void {
    this.viewport.dataSource.removeChangeEventListener(this.listener.bind(this));
  }

  private listener: DataSourceChangeEventListener = (reasons: Set<DataSourceChangeEventReason>): void => {
    if (reasons.has(DataSourceChangeEventReason.CacheInvalidated)) {
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

    const validMarks: Predicate<DataSourceEntry> = ([options, drawing, mark])
      : boolean => options.type === 'HLine' && options.visible && !!options.valid
      && !!options.visibleInViewport && mark !== undefined;

    const x = width - PRICE_LABEL_PADDING;
    for (const [options, drawing, mark] of toRaw(this.viewport.dataSource).filtered(validMarks)) {
      if (mark === undefined || drawing === undefined) {
        continue;
      }

      const y: number = inverted * mark.screenPos;

      native.beginPath();
      native.lineWidth = 1;
      native.fillStyle = options.data.style.color;
      native.rect(0, y - half - 3, width, textStyle.fontSize + 4);
      native.fill();

      native.fillStyle = mark.textColor;
      native.fillText(mark.text, x, y);
    }
  }
}
