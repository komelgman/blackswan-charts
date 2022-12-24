import type { HistoricalIncident, HistoricalIncidentLifeHooks } from '@/model/history/HistoricalIncident';
import type { CanMergeWith } from '@/model/options/CanMergeWith';
import type { Predicate } from '@/model/type-defs';

export interface IsNexusIncident {
  isNexusIncident(): boolean;
}

export const enum TVAProtocolSign {
  NotSigned, Rejected, Approved,
}

export default class TVAProtocol {
  private readonly incidents: HistoricalIncident[] = [];
  private signValue: TVAProtocolSign = TVAProtocolSign.NotSigned;

  public readonly title: string;
  public next?: TVAProtocol = undefined;
  public prev?: TVAProtocol;

  private beforeApply?: () => void;
  private afterApply?: () => void;
  private beforeInverse?: () => void;
  private afterInverse?: () => void;

  constructor(title: string, base: TVAProtocol | undefined = undefined) {
    const current = this.newTimelineFrom(base);
    this.prev = current;
    this.title = title;
    if (current !== undefined) {
      current.next = this;
    }
  }

  public setLifeHooks(hooks: HistoricalIncidentLifeHooks): TVAProtocol {
    this.beforeInverse = hooks.beforeInverse;
    this.afterInverse = hooks.afterInverse;

    this.beforeApply = hooks.beforeApply;
    this.afterApply = hooks.afterApply;

    return this;
  }

  private newTimelineFrom(base: TVAProtocol | undefined): TVAProtocol | undefined {
    let newBase = base;
    if (newBase !== undefined) {
      if (!base?.isSigned) {
        throw new Error('Illegal state: !base?.isSigned');
      }

      // reject all not approved protocols
      while (newBase.sign === TVAProtocolSign.Rejected && newBase.prev !== undefined) {
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

    this.signValue = TVAProtocolSign.Approved;

    this.incidents.forEach((incident, index) => {
      if ((incident as unknown as IsNexusIncident).isNexusIncident !== undefined
        && (incident as unknown as IsNexusIncident).isNexusIncident()) {
        this.incidents.splice(index, 1);
      }
    });

    if (this.incidents.length === 0 && this.prev !== undefined) {
      if (this.next !== undefined) {
        throw new Error('Illegal state: next should be undefined when we sign new protocol');
      }

      this.signValue = TVAProtocolSign.Rejected;
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
    return this.signValue !== TVAProtocolSign.NotSigned;
  }

  public get sign(): TVAProtocolSign {
    return this.signValue;
  }

  public addIncident(incident: HistoricalIncident, immediate: boolean = true): TVAProtocol {
    if (this.signValue) {
      throw new Error('Illegal state: Can\'t add Incident because Protocol already was signed!');
    }

    if (!this.wasMerged(incident, immediate)) {
      this.incidents.push(incident);
      if (immediate) {
        incident.apply();
      }
    }

    return this;
  }

  private wasMerged(incident: HistoricalIncident, immediate: boolean): boolean {
    for (let i = this.incidents.length - 1; i >= 0; i -= 1) {
      const applicant = this.incidents[i];
      const isWasMerged: boolean = applicant !== undefined
        && (applicant as unknown as CanMergeWith<HistoricalIncident>).mergeWith !== undefined
        && (applicant as unknown as CanMergeWith<HistoricalIncident>).mergeWith(incident);

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
