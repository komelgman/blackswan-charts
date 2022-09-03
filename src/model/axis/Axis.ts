import { LogicSize, Range } from '@/model/type-defs';
import { TextStyle } from '@/model/ChartStyle';
import { clone, merge } from '@/misc/strict-type-checks';

export interface AxisOptions<T> {
  range?: Range<T>;
  textStyle?: TextStyle;
  screenSize?: LogicSize;
}

export default abstract class Axis<T extends number, Options extends AxisOptions<T>> {
  private readonly rangeValue: Range<T> = { from: -1 as T, to: 1 as T };
  private readonly textStyleValue: TextStyle;
  private readonly screenSizeValue: LogicSize = { main: -1, second: -1 };
  public readonly labels: Map<number, string> = new Map<number, string>();

  protected constructor(textStyle: TextStyle) {
    this.textStyleValue = textStyle;
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

  public abstract move(screenDelta: number): void;
  public abstract zoom(screenPivot: number, screenDelta: number): void;

  public abstract translate(value: T): number;
  public abstract revert(screenPos: number): T;
}
