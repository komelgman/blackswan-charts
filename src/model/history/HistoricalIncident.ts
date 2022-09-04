export interface HistoricalIncident {
  apply(): void;
  inverse(): void;
}

export interface HistoricalIncidentLifeHooks {
  beforeApply?: () => void;
  afterApply?: () => void;
  beforeInverse?: () => void;
  afterInverse?: () => void;
}

export declare type HistoricalIncidentOptions = HistoricalIncidentLifeHooks;

export abstract class AbstractHistoricalIncident<Options extends HistoricalIncidentOptions> implements HistoricalIncident {
  public readonly options: Options;

  protected constructor(options: Options) {
    this.options = options;
  }

  public apply(): void {
    const { beforeApply, afterApply } = this.options;
    if (beforeApply) {
      beforeApply();
    }

    this.applyIncident();

    if (afterApply) {
      afterApply();
    }
  }

  public inverse(): void {
    const { beforeInverse, afterInverse } = this.options;

    if (beforeInverse) {
      beforeInverse();
    }

    this.inverseIncident();

    if (afterInverse) {
      afterInverse();
    }
  }

  protected abstract applyIncident(): void;
  protected abstract inverseIncident(): void;
}
