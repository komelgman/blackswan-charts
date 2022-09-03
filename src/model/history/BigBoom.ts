import {
  AbstractHistoricalIncident,
  HistoricalIncidentOptions,
} from '@/model/history/HistoricalIncident';

export default class BigBoom extends AbstractHistoricalIncident<HistoricalIncidentOptions> {
  public constructor() {
    super({ });
  }

  protected applyIncident(): void {
    console.debug('Biiig Boom!!');
  }

  protected inverseIncident(): void {
    console.error('Oops, that`s was unexpected!');
  }
}
