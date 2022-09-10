import {
  HistoricalIncident,
  HistoricalIncidentLifeHooks,
} from '@/model/history/HistoricalIncident';
import type { TVAProtocolOptions } from '@/model/history/TimeVarianceAuthority';

export interface HistoricalIncidentReport {
  protocolOptions: TVAProtocolOptions;
  skipIf?: (incident: HistoricalIncident) => boolean;
  incident?: HistoricalIncident;
  sign?: boolean;
  lifeHooks?: HistoricalIncidentLifeHooks;
}

export default class TVAClerk {
  private readonly manager: (incident: HistoricalIncidentReport) => void;

  constructor(incidentManager: (incident: HistoricalIncidentReport) => void) {
    this.manager = incidentManager;
  }

  public processReport(report: HistoricalIncidentReport): void {
    this.manager(report);
  }
}
