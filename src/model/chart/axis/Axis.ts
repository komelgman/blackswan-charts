import { markRaw, reactive, shallowReactive, watch, type WatchHandle } from 'vue';
import { clone } from '@/misc/object.clone';
import { merge } from '@/misc/object.merge';
import { ControlMode, type AxisOptions } from '@/model/chart/axis/types';
import { UpdateAxisControlMode, UpdateAxisRange, UpdateAxisPrimaryEntryRef } from '@/model/chart/axis/incidents';
import type { TextStyle } from '@/model/chart/types/styles';
import type { EntityId } from '@/model/tools/IdBuilder';
import type { LogicSize, Range } from '@/model/chart/types';
import type { HistoricalTransactionManager } from '@/model/history';
import type { Wrapped } from '@/model/type-defs';
import { PrimaryEntry, type PrimaryEntryRef } from '@/model/datasource/PrimaryEntry';
import { deepEqual } from '@/misc/object.deepEqual';
import type { HasPostConstruct } from '@/model/type-defs/optional';

export default abstract class Axis<T extends number, Options extends AxisOptions<T>> implements HasPostConstruct {
  private readonly labelsValue: Wrapped<Map<number, string>>;
  private readonly id: EntityId;
  private readonly rangeValue: Range<T> = shallowReactive({ from: -1 as T, to: 1 as T }) as Range<T>;
  private readonly textStyleValue: TextStyle;
  private readonly screenSizeValue: LogicSize = reactive({ main: -1, second: -1 });

  protected readonly primaryEntry: PrimaryEntry = new PrimaryEntry();
  protected readonly transactionManager: HistoricalTransactionManager;

  private controlModeValue: Wrapped<ControlMode> = shallowReactive({ value: ControlMode.MANUAL });
  private prefRangeWatchHandle?: WatchHandle;

  protected constructor(id: EntityId, historicalTransactionManager: HistoricalTransactionManager, textStyle: TextStyle) {
    this.labelsValue = shallowReactive({ value: markRaw(new Map<number, string>()) });
    this.textStyleValue = reactive(textStyle);
    this.transactionManager = historicalTransactionManager;
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
          this.primaryEntry.invalidate();
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

    if (options.labels !== undefined) {
      Object.assign(this.labelsValue, { value: markRaw(options.labels) });
    }
  }

  public get labels(): Readonly<Wrapped<Map<number, string>>> {
    return this.labelsValue;
  }

  public get range(): Readonly<Range<T>> {
    return this.rangeValue;
  }

  public set range(value: Range<T>) {
    this.transactionManager.openTransaction({ protocolTitle: 'axis-update-range' });
    this.updateRange(() => this.noHistoryManagedUpdate({ range: { ...value } } as Options));
    this.transactionManager.tryCloseTransaction();
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
    this.transactionManager.openTransaction({ protocolTitle: 'axis-update-primary-entry' });

    this.ajustStateWhenPrimaryEntryRefChanged(value);

    this.transactionManager.exeucteInTransaction({
      incident: new UpdateAxisPrimaryEntryRef({
        axis: this,
        entryRef: value,
      }),
    });

    this.transactionManager.tryCloseTransaction();
  }

  protected ajustStateWhenPrimaryEntryRefChanged(newValue: PrimaryEntryRef | undefined): void {
    const { AUTO, MANUAL } = ControlMode;

    if (newValue && this.isManualControlMode()) {
      this.controlMode = AUTO;
    }

    if (!newValue && !this.isManualControlMode()) {
      this.controlMode = MANUAL;
    }
  }

  public isManualControlMode() {
    return this.controlMode.value === ControlMode.MANUAL;
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
  public abstract translateBatchInPlace(values: any[][], indicies: number[]): void;
  public abstract revert(screenPos: number): T;

  public move(screenDelta: number): void {
    const { LOCKED } = ControlMode;
    if (this.controlMode.value === LOCKED) {
      return;
    }

    this.transactionManager.openTransaction({ protocolTitle: 'move-in-viewport' });
    this.ajustStateWhenMovedManually(screenDelta);
    this.transactionManager.tryCloseTransaction();
  }

  public zoom(screenPivot: number, screenDelta: number): void {
    const { LOCKED } = ControlMode;
    if (this.controlMode.value === LOCKED) {
      return;
    }

    const protocolOptions = {
      protocolTitle: `zoom-axis-${this.id}`,
      timeout: 1000, // todo: move to options
    };

    this.transactionManager.openTransaction(protocolOptions);
    this.ajustStateWhenZoomedManually(screenPivot, screenDelta);
    this.transactionManager.tryCloseTransaction({ signOnClose: false });
  }

  protected abstract ajustStateWhenMovedManually(screenDelta: number): void;
  protected abstract ajustStateWhenZoomedManually(screenPivot: number, screenDelta: number): void;

  protected updateRange(updateRangeTrigger: Function): void {
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
  }
}
