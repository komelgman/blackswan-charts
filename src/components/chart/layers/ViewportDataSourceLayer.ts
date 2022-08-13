import Layer from '@/components/layered-canvas/layers/Layer';
import DataSource from '@/model/datasource/DataSource';
import { Inverted, InvertedValue } from '@/model/axis/PriceAxis';
import { toRaw, watch } from 'vue';
import DataSourceChangeEventListener from '@/model/datasource/DataSourceChangeEventListener';
import DataSourceChangeEventReason from '@/model/datasource/DataSourceChangeEventReason';

export default class ViewportDataSourceLayer extends Layer {
  private readonly ds: DataSource;
  private readonly inverted: Inverted;

  constructor(ds: DataSource, priceAxisIsInverted: Inverted) {
    super();

    this.ds = ds;
    this.inverted = priceAxisIsInverted;

    watch([this.inverted], () => { this.invalid = true });
  }

  public installListeners(): void {
    this.ds.addChangeEventListener(this.listener.bind(this));
  }

  public uninstallListeners(): void {
    this.ds.removeChangeEventListener(this.listener.bind(this));
  }

  private listener: DataSourceChangeEventListener = (reasons: Set<DataSourceChangeEventReason>): void => {
    if (reasons.has(DataSourceChangeEventReason.CacheInvalidated)) {
      this.invalid = true;
    }
  };

  protected render(native: CanvasRenderingContext2D, width: number, height: number): void {
    const inverted: InvertedValue = this.inverted.value;
    if (inverted < 0) {
      native.translate(width / 2, height / 2);
      native.rotate(Math.PI);
      native.scale(-1, 1);
      native.translate(-width / 2, -height / 2);
    }

    for (const [_, drawing] of toRaw(this.ds).visible()) {
      if (drawing === undefined) {
        throw new Error('drawing === undefined');
      }

      const { parts } = drawing;
      for (const graphics of parts) {
        graphics.render(this.ctx.native, inverted);
      }
    }
  }
}
