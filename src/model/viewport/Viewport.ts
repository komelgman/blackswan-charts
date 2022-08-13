import TimeAxis from '@/model/axis/TimeAxis';
import PriceAxis, { Inverted } from '@/model/axis/PriceAxis';
import DataSource, { DataSourceEntry } from '@/model/datasource/DataSource';
import {
  ContextMenuOptionsProvider,
  MenuItem,
} from '@/components/context-menu/ContextMenuOptions';
import { Point } from '@/model/type-defs';
import PriceScale from '@/model/axis/scaling/PriceScale';
import { DrawingId, HandleId } from '@/model/datasource/Drawing';

export interface ViewportOptions {
  priceScale: PriceScale;
  priceInverted: Inverted;
}

export default class Viewport implements ContextMenuOptionsProvider {
  public readonly timeAxis: TimeAxis;
  public readonly priceAxis: PriceAxis;
  public readonly dataSource: DataSource;
  // objects which was selected
  public readonly selected: DrawingId[] = [];
  // object which placed below mouse pointer and should be highlighted
  public highlighted?: DataSourceEntry = undefined;
  public cursor?: string = undefined;
  public handle?: HandleId = undefined;

  constructor(dataSource: DataSource, timeAxis: TimeAxis, priceAxis: PriceAxis) {
    this.dataSource = dataSource;
    this.timeAxis = timeAxis;
    this.priceAxis = priceAxis;
  }

  public contextmenu(pos: Point): MenuItem[] {
    return [];
  }
}
