import { reactive } from 'vue';
import { clone } from '@/misc/object.clone';
import { merge } from '@/misc/object.merge';
import type AxisOptions from '@/model/chart/axis/AxisOptions';
import UpdateAxisRange from '@/model/chart/axis/incidents/UpdateAxisRange';
import type { TextStyle } from '@/model/chart/types/styles';
import type { HistoricalProtocolOptions } from '@/model/history/History';
import type { EntityId } from '@/model/tools/IdBuilder';
import type { LogicSize, Range } from '@/model/chart/types';
import type { HistoricalIncidentReportProcessor } from '@/model/history/HistoricalIncidentReport';

export default abstract class Axis<T extends number, Options extends AxisOptions<T>> {
  private readonly rangeValue: Range<T> = reactive({ from: -1 as T, to: 1 as T }) as Range<T>;
  private readonly textStyleValue: TextStyle;
  private readonly screenSizeValue: LogicSize = reactive({ main: -1, second: -1 });
  private readonly id: EntityId;
  public readonly historicalIncidentReportProcessor: HistoricalIncidentReportProcessor;
  public readonly labels: Map<number, string> = reactive(new Map<number, string>());

  protected constructor(id: EntityId, historicalIncidentReportProcessor: HistoricalIncidentReportProcessor, textStyle: TextStyle) {
    this.historicalIncidentReportProcessor = historicalIncidentReportProcessor;
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
    const protocolOptions: HistoricalProtocolOptions = { protocolTitle: 'move-in-viewport' };

    this.historicalIncidentReportProcessor({
      protocolOptions,
      skipIf: (incident) => (incident as UpdateAxisRange<T>).options?.axis === this,
      incident: new UpdateAxisRange({
        axis: this,
        range: { ...this.range },
      }),
    });

    this.updateRange(screenDelta);

    this.historicalIncidentReportProcessor({
      protocolOptions,
      incident: new UpdateAxisRange({
        axis: this,
        range: { ...this.range },
      }),
    });
  }

  public zoom(screenPivot: number, screenDelta: number): void {
    const protocolOptions: HistoricalProtocolOptions = {
      protocolTitle: `zoom-axis-${this.id}`,
      timeout: 1000,
    };

    this.historicalIncidentReportProcessor({
      protocolOptions,
      skipIf: (incident) => (incident as UpdateAxisRange<T>).options?.axis === this,
      incident: new UpdateAxisRange({
        axis: this,
        range: { ...this.range },
      }),
    });

    this.updateZoom(screenPivot, screenDelta);

    this.historicalIncidentReportProcessor({
      protocolOptions,
      incident: new UpdateAxisRange({
        axis: this,
        range: { ...this.range },
      }),
    });
  }

  protected abstract updateRange(screenDelta: number): void;

  protected abstract updateZoom(screenPivot: number, screenDelta: number): void;
}
