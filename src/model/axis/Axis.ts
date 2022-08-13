import { LogicSize, Point, Range } from '@/model/type-defs';
import { ContextMenuOptionsProvider, MenuItem } from '@/components/context-menu/ContextMenuOptions';
import { TextStyle } from '@/model/ChartStyle';

export default abstract class Axis<T extends number> implements ContextMenuOptionsProvider {
  public readonly range: Range<T> = { from: -1 as T, to: 1 as T };
  public readonly labels: Map<number, string> = new Map<number, string>();
  public readonly textStyle: TextStyle;
  public readonly screenSize: LogicSize = { main: -1, second: -1 };

  protected constructor(textStyle: TextStyle) {
    this.textStyle = textStyle;
  }

  public abstract move(screenDelta: number): void;
  public abstract zoom(screenPivot: number, screenDelta: number): void;

  public abstract translate(value: T): number;
  public abstract revert(screenPos: number): T;

  public abstract contextmenu(pos: Point): MenuItem[];
}
