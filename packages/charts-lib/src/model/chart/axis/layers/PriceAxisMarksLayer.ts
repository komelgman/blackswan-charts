import { watch, type WatchStopHandle } from 'vue';
import { makeFont } from '@/model/misc/function.makeFont';
import type { PriceAxis } from '@/model/chart/axis/PriceAxis';
import {
  DataSourceChangeEventReason,
  type DataSourceChangeEventListener,
  type DataSourceChangeEventsMap,
} from '@/model/datasource/events';
import type { DataSourceEntry } from '@/model/datasource/types';
import type { Predicate } from 'blackswan-foundation';
import type DataSource from '@/model/datasource/DataSource';
import { PRICE_LABEL_PADDING } from '@/model/chart/axis/layers/PriceAxisLabelsLayer';
import { DirectRenderLayer } from '@blackswan/layered-canvas/model';

export class PriceAxisMarksLayer extends DirectRenderLayer {
  private readonly dataSource: DataSource;
  private readonly priceAxis: PriceAxis;
  private readonly dataSourceChangeEventListener: DataSourceChangeEventListener = (events: DataSourceChangeEventsMap): void => {
    const { CacheInvalidated, RemoveEntry } = DataSourceChangeEventReason;
    if (events.has(CacheInvalidated) || events.has(RemoveEntry)) {
      this.invalid = true;
    }
  };

  constructor(dataSource: DataSource, priceAxis: PriceAxis) {
    super();

    this.dataSource = dataSource;
    this.priceAxis = priceAxis;
  }

  public init(): void {
    super.init();
    this.installListeners();
  }

  protected installWatcher(): WatchStopHandle {
    return watch([
      this.priceAxis.textStyle,
      this.priceAxis.inverted,
    ], () => {
      this.invalid = true;
    });
  }

  public destroy(): void {
    this.uninstallListeners();
    super.destroy();
  }

  protected doRender(): void {
    const { textStyle } = this.priceAxis;
    const half = textStyle.fontSize / 2;
    const { height, width } = this.context;
    const { renderingContext } = this;

    if (!renderingContext) {
      return;
    }

    renderingContext.textBaseline = 'middle';
    renderingContext.textAlign = 'end';
    renderingContext.font = makeFont(textStyle);

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

      const y: number = mark.screenPos;

      renderingContext.beginPath();
      renderingContext.lineWidth = 1;
      renderingContext.fillStyle = mark.bgColor;
      renderingContext.rect(0, y - half - 3, width, textStyle.fontSize + 4);
      renderingContext.fill();

      renderingContext.fillStyle = mark.textColor;
      renderingContext.fillText(mark.text, x, y);
    }
  }

  private installListeners(): void {
    this.dataSource.addChangeEventListener(this.dataSourceChangeEventListener);
  }

  private uninstallListeners(): void {
    this.dataSource.removeChangeEventListener(this.dataSourceChangeEventListener);
  }
}
