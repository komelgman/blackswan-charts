import Axis from '@/model/chart/axis/Axis';
import { type AxisOptions, ControlMode, ZoomType } from '@/model/chart/axis/types';
import type { UTCTimestamp, Range } from '@/model/chart/types';
import type { TextStyle } from '@/model/chart/types/styles';
import { PostConstruct, type Wrapped } from '@blackswan/foundation';
import type { HistoricalTransactionManager } from '@/model/history';
import { UpdateTimeAxisJustfollow } from '@/model/chart/axis/incidents';

export interface TimeAxisOptions extends AxisOptions<UTCTimestamp> {
  justfollow: boolean;
}

@PostConstruct
export default class TimeAxis extends Axis<UTCTimestamp, TimeAxisOptions> {
  private cache!: [/* scaleK */ number, /* unscaleK */ number];
  private readonly isJustFollowValue: Wrapped<boolean> = { value: false };

  public constructor(historicalTransactionManager: HistoricalTransactionManager, textOptions: TextStyle) {
    super('time', historicalTransactionManager, textOptions);
  }

  public postConstruct(): void {
    super.postConstruct();
    this.invalidateCache();
  }

  public noHistoryManagedUpdate(options: Partial<TimeAxisOptions>): void {
    super.noHistoryManagedUpdate(options);

    if (options.justfollow !== undefined) {
      Object.assign(this.isJustFollowValue, { value: options.justfollow });
    }

    if (options.range !== undefined || options.screenSize?.main !== undefined) {
      this.invalidateCache();
    }
  }

  public isJustFollow(): boolean {
    return this.isJustFollowValue.value;
  }

  public get justFollow(): Wrapped<boolean> {
    return this.isJustFollowValue;
  }

  public set justFollow(value: boolean) {
    if (this.isJustFollow() === value) {
      return;
    }

    this.transactionManager.transact({
      protocolOptions: { protocolTitle: 'time-axis-update-justfollow' },
      incident: new UpdateTimeAxisJustfollow({
        axis: this,
        justfollow: value,
      }),
    });
  }

  protected get preferredRange(): Readonly<Wrapped<Range<UTCTimestamp> | undefined>> {
    return this.primaryEntry.preferredTimeRange;
  }

  private invalidateCache(): void {
    const { main: screenSize } = this.screenSize;
    const { from, to } = this.range;
    const size = to - from;
    const scaleK = screenSize / size;
    const unscaleK = size / screenSize;

    this.cache = [scaleK, unscaleK];
  }

  public translate(value: UTCTimestamp): number {
    const { from } = this.range;
    const [scaleK] = this.cache;
    return (value - from) * scaleK;
  }

  public translateBatchInPlace(values: any[][], indicies: number[]): void {
    const [scaleK] = this.cache;
    const { from } = this.range;

    for (let i = 0; i < values.length; ++i) {
      const value = values[i];
      for (let j = 0; j < indicies.length; j++) {
        const index = indicies[j];
        value[index] = (value[index] - from) * scaleK;
      }
    }
  }

  public revert(screenPos: number): UTCTimestamp {
    const { from } = this.range;
    const [, unscaleK] = this.cache;
    return (from + unscaleK * screenPos) as UTCTimestamp;
  }

  protected ajustStateWhenZoomedManually(screenPivot: number, screenDelta: number): void {
    this.ajustControlModeAndJustfollowWhenZoomedManually(screenPivot);
    this.ajustRangeWhenZoomedManually(screenPivot, screenDelta);
  }

  private ajustControlModeAndJustfollowWhenZoomedManually(screenPivot: number) {
    const { AUTO, MANUAL } = ControlMode;
    if (this.controlMode.value !== AUTO) {
      return;
    }

    if (screenPivot !== this.screenSize.main) {
      this.controlMode = MANUAL;
    } else {
      this.justFollow = true;
    }
  }

  private ajustRangeWhenZoomedManually(screenPivot: number, screenDelta: number) {
    this.updateRange(() => {
      const { main: screenSize } = this.screenSize;
      const { from, to } = this.range;
      if (screenSize < 0) {
        return;
      }

      const size = to - from;
      const zoomType: ZoomType = screenDelta > 0 ? ZoomType.IN : ZoomType.OUT;
      const delta = size * zoomType.valueOf();

      this.noHistoryManagedUpdate({
        range: {
          from: from + (delta * (screenPivot / screenSize)) as UTCTimestamp,
          to: to - (delta * ((screenSize - screenPivot) / screenSize)) as UTCTimestamp,
        },
      });
    });
  }

  protected ajustStateWhenMovedManually(screenDelta: number): void {
    this.ajustControlModeAndJustfollowWhenMovedManually();
    this.ajustRangeWhenMovedManually(screenDelta);
  }

  private ajustControlModeAndJustfollowWhenMovedManually() {
    if (this.controlMode.value === ControlMode.AUTO) {
      this.controlMode = ControlMode.MANUAL;
    }

    this.justFollow = false;
  }

  private ajustRangeWhenMovedManually(screenDelta: number) {
    this.updateRange(() => {
      const { main: screenSize } = this.screenSize;
      const { from, to } = this.range;
      if (screenSize < 0) {
        return;
      }

      const size = to - from;
      const unscaleK = size / screenSize;
      const revert = (screenPos: number): UTCTimestamp => (from + unscaleK * screenPos) as UTCTimestamp;

      this.noHistoryManagedUpdate({
        range: { from: revert(screenDelta), to: revert(screenSize + screenDelta) },
      });
    });
  }
}
