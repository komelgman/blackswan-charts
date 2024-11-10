import { reactive } from 'vue';
import { clone } from '@/misc/object.clone';
import { merge } from '@/misc/object.merge';
import { ControlMode, type AxisOptions } from '@/model/chart/axis/types';
import { UpdateAxisControlMode, UpdateAxisRange } from '@/model/chart/axis/incidents';
import type { TextStyle } from '@/model/chart/types/styles';
import type { EntityId } from '@/model/tools/IdBuilder';
import type { LogicSize, Range } from '@/model/chart/types';
import type { HistoricalProtocolOptions, HistoricalTransactionManager } from '@/model/history';
import type { Wrapped } from '@/model/type-defs';

export default abstract class Axis<T extends number, Options extends AxisOptions<T>> {
  private readonly id: EntityId;
  private readonly rangeValue: Range<T> = reactive({ from: -1 as T, to: 1 as T }) as Range<T>;
  private readonly textStyleValue: TextStyle;
  private readonly screenSizeValue: LogicSize = reactive({ main: -1, second: -1 });
  private readonly prefferedRangeValue: Wrapped<Range<T> | undefined> = { value: undefined };
  private readonly controlModeValue: Wrapped<ControlMode> = { value: ControlMode.MANUAL };
  protected readonly transactionManager: HistoricalTransactionManager;
  public readonly labels: Map<number, string> = reactive(new Map<number, string>());

  protected constructor(id: EntityId, historicalTransactionManager: HistoricalTransactionManager, textStyle: TextStyle) {
    this.transactionManager = historicalTransactionManager;
    this.textStyleValue = reactive(textStyle);
    this.id = id;
  }

  public noHistoryManagedUpdate(options: Options): void {
    if (options.range !== undefined) {
      merge(this.rangeValue, { ...options.range });
    }

    if (options.textStyle !== undefined) {
      merge(this.textStyleValue, clone(options.textStyle));
    }

    if (options.screenSize !== undefined) {
      merge(this.screenSizeValue, { ...options.screenSize });
    }

    if (options.primaryEntry !== undefined) {
      merge(this.prefferedRangeValue, { value: options.primaryEntry });
    }

    if (options.controlMode !== undefined) {
      merge(this.controlModeValue, { value: options.controlMode });
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

  public get controlMode(): Readonly<Wrapped<ControlMode>> {
    return this.controlModeValue;
  }

  public set controlMode(value: ControlMode) {
    if (value === this.controlMode.value) {
      return;
    }

    if (value === ControlMode.AUTO && !this.prefferedRangeValue.value) {
      throw new Error('IlligalState: can\'t auto control axis with no prefferedRange');
    }

    this.transactionManager.transact({
      protocolOptions: { protocolTitle: 'axis-update-controlmode' },
      incident: new UpdateAxisControlMode({
        axis: this,
        controlMode: this.controlMode.value,
      }),
    });
  }

  public abstract translate(value: T): number;

  public abstract revert(screenPos: number): T;

  public move(screenDelta: number): void {
    this.updateRange({ protocolTitle: 'move-in-viewport' }, () => this.moveAxisRangeByDelta(screenDelta));
  }

  public zoom(screenPivot: number, screenDelta: number): void {
    const protocolOptions = {
      protocolTitle: `zoom-axis-${this.id}`,
      timeout: 1000,
    };

    this.updateRange(protocolOptions, () => this.zoomInAxisRange(screenPivot, screenDelta));
  }

  private updateRange(protocolOptions: HistoricalProtocolOptions, updateRangeTrigger: Function): void {
    const { AUTO, MANUAL, LOCKED } = ControlMode;
    if (this.controlMode.value === LOCKED) {
      return;
    }

    this.transactionManager.openTransaction(protocolOptions);

    if (this.controlMode.value === AUTO) {
      this.controlMode = MANUAL;
    }

    this.transactionManager.exeucteInTransaction({
      skipIf: (incident) => (incident as UpdateAxisRange<T>).options?.axis === this,
      incident: new UpdateAxisRange({
        axis: this,
        range: { ...this.range },
      }),
    });

    updateRangeTrigger();

    this.transactionManager.exeucteInTransaction({
      incident: new UpdateAxisRange({
        axis: this,
        range: { ...this.range },
      }),
    });

    this.transactionManager.tryCloseTransaction();
  }

  protected abstract moveAxisRangeByDelta(screenDelta: number): void;

  protected abstract zoomInAxisRange(screenPivot: number, screenDelta: number): void;
}
