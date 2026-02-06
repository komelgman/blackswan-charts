import { type Predicate, type HasMergeWith } from 'blackswan-foundation';
import type {
  HistoricalIncident,
  HistoricalIncidentLifeHooks,
} from '@/model/history';

/**
 * Indicates that incident shouldn't be stored,
 * because incident state has initial state
 *
 * @example: the update incident that has no actual changes
 */
export interface IsEmptyIncident {
  isEmptyIncident(): boolean;
}

export const enum HistoricalProtocolSign {
  NotSigned,
  Rejected,
  Approved,
}

export class HistoricalProtocol {
  private readonly incidents: HistoricalIncident[] = [];
  private signValue: HistoricalProtocolSign = HistoricalProtocolSign.NotSigned;

  public readonly title: string;
  public next?: HistoricalProtocol = undefined;
  public prev?: HistoricalProtocol;

  private beforeApply?: () => void;
  private afterApply?: () => void;
  private beforeInverse?: () => void;
  private afterInverse?: () => void;

  constructor(title: string, base: HistoricalProtocol | undefined = undefined) {
    const current = this.newTimelineFrom(base);
    this.prev = current;
    this.title = title;
    if (current !== undefined) {
      current.next = this;
    }
  }

  public setLifeHooks(hooks: HistoricalIncidentLifeHooks): HistoricalProtocol {
    this.beforeInverse = hooks.beforeInverse;
    this.afterInverse = hooks.afterInverse;

    this.beforeApply = hooks.beforeApply;
    this.afterApply = hooks.afterApply;

    return this;
  }

  private newTimelineFrom(base: HistoricalProtocol | undefined): HistoricalProtocol | undefined {
    let newBase = base;
    if (newBase !== undefined) {
      if (!base?.isSigned) {
        throw new Error('Illegal state: !base?.isSigned');
      }

      // reject all not approved protocols
      while (
        newBase.sign === HistoricalProtocolSign.Rejected
        && newBase.prev !== undefined
      ) {
        newBase = newBase.prev;
      }
    }

    let tmp = newBase;
    while (tmp !== undefined) {
      const tmp2 = tmp.next;
      if (tmp !== base) {
        tmp.prev = undefined;
      }

      tmp.next = undefined;
      tmp = tmp2;
    }

    return newBase;
  }

  public apply(): void {
    if (this.beforeApply) {
      this.beforeApply();
    }

    for (const incident of this.incidents) {
      incident.apply();
    }

    if (this.afterApply) {
      this.afterApply();
    }
  }

  public inverse(): void {
    if (this.beforeInverse) {
      this.beforeInverse();
    }

    for (let i = this.incidents.length - 1; i >= 0; i -= 1) {
      this.incidents[i].inverse();
    }

    if (this.afterInverse) {
      this.afterInverse();
    }
  }

  public trySign(): void {
    if (this.isSigned) {
      throw new Error('Illegal state: Protocol already was signed!');
    }

    this.signValue = HistoricalProtocolSign.Approved;

    for (let index = this.incidents.length - 1; index >= 0; index--) {
      if ((this.incidents[index] as unknown as IsEmptyIncident)?.isEmptyIncident?.()) {
        this.incidents.splice(index, 1);
      }
    }

    if (this.incidents.length === 0 && this.prev !== undefined) {
      if (this.next !== undefined) {
        throw new Error(
          'Illegal state: next should be undefined when we sign new protocol',
        );
      }

      this.signValue = HistoricalProtocolSign.Rejected;
      this.inverse();
    }
  }

  public get isEmpty(): boolean {
    return this.incidents.length === 0;
  }

  public hasIncident(predicate: Predicate<HistoricalIncident>): boolean {
    for (const incident of this.incidents) {
      if (predicate(incident)) {
        return true;
      }
    }

    return false;
  }

  public get isSigned(): boolean {
    return this.signValue !== HistoricalProtocolSign.NotSigned;
  }

  public get sign(): HistoricalProtocolSign {
    return this.signValue;
  }

  public addIncident(incident: HistoricalIncident, immediate: boolean = true): HistoricalProtocol {
    if (this.signValue) {
      throw new Error(
        "Illegal state: Can't add Incident because Protocol already was signed!",
      );
    }

    if (!this.tryMerge(incident, immediate)) {
      this.incidents.push(incident);
      if (immediate) {
        incident.apply();
      }
    }

    return this;
  }

  private tryMerge(incident: HistoricalIncident, immediate: boolean): boolean {
    for (let i = this.incidents.length - 1; i >= 0; i -= 1) {
      const applicant = this.incidents[i];
      const isWasMerged: boolean = (
        applicant as unknown as HasMergeWith<HistoricalIncident>
      )?.mergeWith?.(incident);

      if (isWasMerged) {
        if (immediate) {
          applicant.apply();
        }

        return true;
      }
    }

    return false;
  }
}
