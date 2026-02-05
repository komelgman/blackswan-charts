import { InitialIncident } from '@/model/history/incidents';
import { type HistoricalIncidentReport, HistoricalProtocol, HistoricalProtocolSign } from '@/model/history';
import { NonReactive } from '@/model/type-defs/decorators';

export interface HistoricalProtocolOptions {
  protocolTitle: string;
  timeout?: number;
}

@NonReactive
export class History {
  private currentProtocolValue: HistoricalProtocol;
  private lastProtocolTitle: string | undefined;
  private lastTimeWhenProtocolWasUsed!: number;

  constructor() {
    this.currentProtocolValue = new HistoricalProtocol('big-boom');
    this.currentProtocolValue.addIncident(new InitialIncident());
    this.currentProtocolValue.trySign();
  }

  private set currentProtocol(value: HistoricalProtocol) {
    this.currentProtocolValue = value;
  }

  private get currentProtocol(): HistoricalProtocol {
    while (this.currentProtocolValue.sign === HistoricalProtocolSign.Rejected) {
      const prev = this.currentProtocolValue?.prev;
      const next = this.currentProtocolValue?.next;

      if (prev) {
        prev.next = next;
        this.currentProtocolValue = prev;
      }

      if (next) {
        next.prev = prev;
      }
    }

    return this.currentProtocolValue;
  }

  public get isCanUndo(): boolean {
    return this.currentProtocol.prev !== undefined;
  }

  public get isCanRedo(): boolean {
    return this.currentProtocol.next !== undefined;
  }

  public redo(): void {
    if (!this.isCanRedo) {
      console.warn("Illegal state, can't do redo");
      return;
    }

    this.currentProtocol = this.currentProtocol.next as HistoricalProtocol;
    this.currentProtocol.apply();
  }

  public undo(): void {
    if (!this.isCanUndo) {
      console.warn("Illegal state, can't do undo");
      return;
    }

    if (!this.currentProtocol.isSigned) {
      this.currentProtocol.trySign(); // will be inversed in case when rejected
    }

    if (this.currentProtocol.sign === HistoricalProtocolSign.Approved) {
      this.currentProtocol.inverse();
    }

    this.currentProtocol = this.currentProtocol.prev as HistoricalProtocol;
  }

  public clear(): void {
    while (this.isCanUndo) {
      const tmp = this.currentProtocol;
      this.currentProtocol = tmp.prev as HistoricalProtocol;
      this.currentProtocol.next = undefined;
      tmp.prev = undefined;
    }
  }

  public addReport(report: HistoricalIncidentReport): void {
    const protocol = this.getProtocol(report.protocolOptions);
    if (report.skipIf && protocol.hasIncident(report.skipIf)) {
      return;
    }

    if (report.lifeHooks) {
      protocol.setLifeHooks(report.lifeHooks);
    }

    if (report.incident) {
      protocol.addIncident(report.incident, report.immediate);
    }

    if (report.sign) {
      protocol.trySign();
    }
  }

  private getProtocol(options: HistoricalProtocolOptions): HistoricalProtocol {
    if (this.lastProtocolTitle === undefined && !this.currentProtocol.isSigned) {
      throw new Error(
        'Illegal state: this.lastIncident === undefined && !this.current.isSigned',
      );
    }

    const isInTime: boolean = options.timeout === undefined
      || Date.now() - (this.lastTimeWhenProtocolWasUsed || 0) <= options.timeout;

    const isNewProtocol = this.lastProtocolTitle !== undefined && this.lastProtocolTitle !== options.protocolTitle;
    const isTimeoutExpired = this.lastProtocolTitle === options.protocolTitle && !isInTime;

    if (!this.currentProtocol.isSigned && (isNewProtocol || isTimeoutExpired)) {
      this.currentProtocol.trySign();
    }

    if (this.currentProtocol.isSigned) {
      this.currentProtocol = new HistoricalProtocol(options.protocolTitle, this.currentProtocol);
    }

    this.lastTimeWhenProtocolWasUsed = Date.now();
    this.lastProtocolTitle = options.protocolTitle;

    return this.currentProtocol;
  }
}
