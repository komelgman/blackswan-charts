import { reactive, shallowReactive, watch, type WatchHandle } from 'vue';
import { clone } from '@/misc/object.clone';
import { merge } from '@/misc/object.merge';
import { ControlMode, type AxisOptions } from '@/model/chart/axis/types';
import { UpdateAxisControlMode, UpdateAxisRange } from '@/model/chart/axis/incidents';
import type { TextStyle } from '@/model/chart/types/styles';
import type { EntityId } from '@/model/tools/IdBuilder';
import type { LogicSize, Range } from '@/model/chart/types';
import type { HistoricalProtocolOptions, HistoricalTransactionManager } from '@/model/history';
import type { Wrapped } from '@/model/type-defs';
import { PrimaryEntry, type PrimaryEntryRef } from '@/model/datasource/PrimaryEntry';
import { UpdateAxisPrimaryEntryRef } from './incidents/UpdateAxisPrimaryEntryRef';
import { deepEqual } from '@/misc/object.deepEqual';
import type { HasPostConstruct } from '@/model/type-defs/optional';

export default abstract class Axis<T extends number, Options extends AxisOptions<T>> implements HasPostConstruct {
  public readonly labels: Map<number, string> = shallowReactive(new Map<number, string>());

  private readonly id: EntityId;
  private readonly rangeValue: Range<T> = shallowReactive({ from: -1 as T, to: 1 as T }) as Range<T>;
  private readonly textStyleValue: TextStyle;
  private readonly screenSizeValue: LogicSize = reactive({ main: -1, second: -1 });
  private prefRangeWatchHandle?: WatchHandle;

  protected readonly primaryEntry: PrimaryEntry = new PrimaryEntry();
  protected readonly transactionManager: HistoricalTransactionManager;

  private controlModeValue: Wrapped<ControlMode> = shallowReactive({ value: ControlMode.MANUAL });

  protected constructor(id: EntityId, historicalTransactionManager: HistoricalTransactionManager, textStyle: TextStyle) {
    this.transactionManager = historicalTransactionManager;
    this.textStyleValue = reactive(textStyle);
    this.id = id;
  }

  public postConstruct(): void {
    this.prefRangeWatchHandle = watch(
      this.preferredRange,
      (range) => this.noHistoryManagedUpdate({ range: range.value } as Options),
    );

    this.prefRangeWatchHandle.pause();

    watch(
      this.controlMode,
      (controlMode) => {
        if (controlMode.value === ControlMode.MANUAL) {
          this.prefRangeWatchHandle?.pause();
        } else {
          this.noHistoryManagedUpdate({ range: this.preferredRange.value } as Options);
          this.prefRangeWatchHandle?.resume();
        }
      },
    );
  }

  public noHistoryManagedUpdate(options: Options): void {
    const { hasOwnProperty: hasOwn } = Object.prototype;

    if (options.range !== undefined && !deepEqual(options.range, this.rangeValue)) {
      Object.assign(this.rangeValue, { ...options.range });
    }

    if (options.textStyle !== undefined) {
      merge(this.textStyleValue, clone(options.textStyle));
    }

    if (options.screenSize !== undefined) {
      merge(this.screenSizeValue, { ...options.screenSize });
    }

    if (hasOwn.call(options, 'primaryEntryRef')) {
      this.primaryEntry.entryRef = options.primaryEntryRef;
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

  protected abstract get preferredRange(): Readonly<Wrapped<Range<T> | undefined>>;

  public get primaryEntryRef(): Wrapped<PrimaryEntryRef | undefined> {
    return this.primaryEntry.entryRef;
  }

  public set primaryEntryRef(value: PrimaryEntryRef | undefined) {
    const { AUTO, MANUAL } = ControlMode;

    this.transactionManager.openTransaction({ protocolTitle: 'axis-update-primary-entry' });

    if (value && this.controlMode.value === MANUAL) {
      this.controlMode = AUTO;
    }

    if (!value && this.controlMode.value !== MANUAL) {
      this.controlMode = MANUAL;
    }

    this.transactionManager.exeucteInTransaction({
      incident: new UpdateAxisPrimaryEntryRef({
        axis: this,
        entryRef: value,
      }),
    });

    this.transactionManager.tryCloseTransaction();
  }

  public get controlMode(): Readonly<Wrapped<ControlMode>> {
    return this.controlModeValue;
  }

  public set controlMode(value: ControlMode) {
    if (value === this.controlMode.value) {
      return;
    }

    this.transactionManager.openTransaction({ protocolTitle: 'axis-update-controlmode' });

    if (value !== ControlMode.MANUAL) {
      this.transactionManager.exeucteInTransaction({
        incident: new UpdateAxisRange({
          axis: this,
          range: { ...this.range },
          ignoreEmptyChecking: true,
        }),
        immediate: false,
      });
    }

    this.transactionManager.exeucteInTransaction({
      incident: new UpdateAxisControlMode({
        axis: this,
        controlMode: value,
      }),
    });

    this.transactionManager.tryCloseTransaction();
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
      immediate: false,
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
