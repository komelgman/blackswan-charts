import BigBoom from '@/model/history/BigBoom';
import TVAClerk from '@/model/history/TVAClerk';
import type { HistoricalIncidentReport } from '@/model/history/TVAClerk';
import TVAProtocol, { TVAProtocolSign } from '@/model/history/TVAProtocol';

export interface TVAProtocolOptions {
  incident: string;
  timeout?: number;
}

export default class TimeVarianceAuthority {
  private current: TVAProtocol;
  private lastIncident: string | undefined;
  private lastTimeWhenProtocolUsed!: number;
  private clerkValue: TVAClerk;

  constructor() {
    this.current = new TVAProtocol('big-boom');
    this.current.addIncident(new BigBoom());
    this.current.trySign();
    this.clerkValue = new TVAClerk(this.reportProcessor);
  }

  public getProtocol(options: TVAProtocolOptions): TVAProtocol {
    if (this.lastIncident === undefined && !this.current.isSigned) {
      throw new Error('Illegal state: this.lastIncident === undefined && !this.current.isSigned');
    }

    const isInTime: boolean = options.timeout === undefined
      || (Date.now() - (this.lastTimeWhenProtocolUsed || 0) <= options.timeout);

    const isNewProtocol = this.lastIncident !== undefined && this.lastIncident !== options.incident;
    const isTimeoutExpired = (this.lastIncident === options.incident && !isInTime);

    if (!this.current.isSigned && (isNewProtocol || isTimeoutExpired)) {
      this.current.trySign();
    }

    if (this.current.isSigned) {
      this.current = new TVAProtocol(options.incident, this.current);
    }

    this.lastTimeWhenProtocolUsed = Date.now();
    this.lastIncident = options.incident;

    return this.current;
  }

  public get isCanUndo(): boolean {
    return this.current.prev !== undefined;
  }

  public get isCanRedo(): boolean {
    return this.current.next !== undefined;
  }

  public redo(): void {
    if (!this.isCanRedo) {
      console.warn('Illegal state, can\'t do redo');
      return;
    }

    this.current = this.current.next as TVAProtocol;
    this.current.apply();

    console.debug(`redo: ${this.current.title}`);
  }

  public undo(): void {
    if (!this.isCanUndo) {
      console.warn('Illegal state, can\'t do undo');
      return;
    }

    if (!this.current.isSigned) {
      this.current.trySign(); // will be inversed in case when rejected
    }

    if (this.current.sign === TVAProtocolSign.Approved) {
      this.current.inverse();
    }

    console.debug(`undo: ${this.current.title}`);

    this.current = this.current.prev as TVAProtocol;
  }

  public clear(): void {
    while (this.isCanUndo) {
      const tmp = this.current;
      this.current = tmp.prev as TVAProtocol;
      this.current.next = undefined;
      tmp.prev = undefined;
    }
  }

  public get clerk(): TVAClerk {
    return this.clerkValue;
  }

  private reportProcessor: (report: HistoricalIncidentReport) => void = (report): void => {
    const protocol = this.getProtocol(report.protocolOptions);
    if (report.skipIf && protocol.hasIncident(report.skipIf)) {
      return;
    }

    if (report.incident) {
      protocol.addIncident(report.incident, report.immediate);
    }

    if (report.lifeHooks) {
      protocol.setLifeHooks(report.lifeHooks);
    }

    if (report.sign) {
      protocol.trySign();
    }
  };
}
