import type { HistoricalIncidentOptions } from '@/model/history/HistoricalIncident';
import { AbstractHistoricalIncident } from '@/model/history/HistoricalIncident';

export default class InitialIncident extends AbstractHistoricalIncident<HistoricalIncidentOptions> {
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
