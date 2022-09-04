import { LogicSize, Range } from '@/model/type-defs';
import { TextStyle } from '@/model/ChartStyle';
import { clone, merge } from '@/misc/strict-type-checks';
import TVAProtocol from '@/model/history/TVAProtocol';
import UpdateAxisRange from '@/model/axis/incidents/UpdateAxisRange';
import TimeVarianceAuthority from '@/model/history/TimeVarianceAuthority';

export interface AxisOptions<T> {
  range?: Range<T>;
  textStyle?: TextStyle;
  screenSize?: LogicSize;
}

export default abstract class Axis<T extends number, Options extends AxisOptions<T>> {
  private readonly rangeValue: Range<T> = { from: -1 as T, to: 1 as T };
  private readonly textStyleValue: TextStyle;
  private readonly screenSizeValue: LogicSize = { main: -1, second: -1 };
  private readonly id: number;
  protected tva: TimeVarianceAuthority;
  public readonly labels: Map<number, string> = new Map<number, string>();

  protected constructor(tva: TimeVarianceAuthority, textStyle: TextStyle) {
    this.tva = tva;
    this.textStyleValue = textStyle;

    this.id = Math.random(); // todo: get uid
  }

  public update(options: Options): void {
    if (options.range) {
      merge(this.rangeValue, { ...options.range });
    }

    if (options.textStyle) {
      merge(this.textStyleValue, clone(options.textStyle))
    }

    if (options.screenSize) {
      merge(this.screenSizeValue, { ...options.screenSize });
    }
  }

  public get range(): Readonly<Range<T>> {
    return this.rangeValue;
  }

  public get screenSize(): Readonly<LogicSize> {
    return this.screenSizeValue;
  }

  public get textStyle(): Readonly<TextStyle> {
    return this.textStyleValue;
  }

  public abstract translate(value: T): number;
  public abstract revert(screenPos: number): T;

  public move(screenDelta: number): void {
    const protocol: TVAProtocol = this.tva.getProtocol({ incident: 'move-in-viewport' });

    if (!protocol.hasIncident((incident) => (incident as UpdateAxisRange<T>).options?.axis === this)) {
      // setup initial value
      protocol.addIncident(new UpdateAxisRange({
        axis: this,
        range: { ...this.range },
      }));
    }

    this.updatePosition(screenDelta);

    protocol.addIncident(new UpdateAxisRange({
      axis: this,
      range: { ...this.range },
    }));
  }

  public zoom(screenPivot: number, screenDelta: number): void {
    const protocol: TVAProtocol = this.tva.getProtocol({ incident: `zoom-axis-${this.id}`, timeout: 1000 });

    if (!protocol.hasIncident((incident) => (incident as UpdateAxisRange<T>).options?.axis === this)) {
      // setup initial value
      protocol.addIncident(new UpdateAxisRange({
        axis: this,
        range: { ...this.range },
      }));
    }

    this.updateZoom(screenPivot, screenDelta);

    protocol.addIncident(new UpdateAxisRange({
      axis: this,
      range: { ...this.range },
    }));
  }

  protected abstract updatePosition(screenDelta: number): void;
  protected abstract updateZoom(screenPivot: number, screenDelta: number): void;
}
