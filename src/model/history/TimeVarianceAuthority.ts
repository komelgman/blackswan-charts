import BigBoom from '@/model/history/BigBoom';
import TVAProtocol, { TVAProtocolSign } from '@/model/history/TVAProtocol';

export interface TVAProtocolOptions {
  incident: string;
  timeout?: number;
}

export default class TimeVarianceAuthority {
  private current: TVAProtocol;
  private lastIncident: string | undefined;
  private lastTimeWhenProtocolUsed!: number;

  constructor() {
    this.current = new TVAProtocol();
    this.current.addIncident(new BigBoom());
    this.current.trySign();
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
      this.current = new TVAProtocol(this.current);
    }

    this.lastTimeWhenProtocolUsed = Date.now();
    this.lastIncident = options.incident;

    return this.current;
  }

  public canUndo(): boolean {
    return this.current.prev !== undefined;
  }

  public canRedo(): boolean {
    return this.current.next !== undefined;
  }

  public redo(): void {
    if (!this.canRedo()) {
      console.warn('Illegal state, can\'t do redo');
      return;
    }

    this.current = this.current.next as TVAProtocol;
    this.current.apply();
  }

  public undo(): void {
    if (!this.canUndo()) {
      console.warn('Illegal state, can\'t do undo');
      return;
    }

    if (!this.current.isSigned) {
      this.current.trySign(); // will be inversed in case when rejected
    }

    if (this.current.sign === TVAProtocolSign.Approved) {
      this.current.inverse();
    }

    this.current = this.current.prev as TVAProtocol;
  }

  public clear(): void {
    while (this.canUndo()) {
      const tmp = this.current;
      this.current = tmp.prev as TVAProtocol;
      this.current.next = undefined;
      tmp.prev = undefined;
    }
  }
}
