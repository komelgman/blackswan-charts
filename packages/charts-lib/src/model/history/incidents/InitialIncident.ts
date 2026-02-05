import { type HistoricalIncidentOptions, AbstractHistoricalIncident } from '@/model/history';

export class InitialIncident extends AbstractHistoricalIncident<HistoricalIncidentOptions> {
  public constructor() {
    super({});
  }

  protected applyIncident(): void {
    // do nothing
  }

  protected inverseIncident(): void {
    console.error('Oops, that`s was unexpected!');
  }
}
