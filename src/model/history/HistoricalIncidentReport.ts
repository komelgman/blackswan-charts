import type {
  HistoricalIncident,
  HistoricalIncidentLifeHooks,
} from '@/model/history/HistoricalIncident';
import type { TVAProtocolOptions } from '@/model/history/TimeVarianceAuthority';

export interface HistoricalIncidentReport {
  protocolOptions: TVAProtocolOptions;
  skipIf?: (incident: HistoricalIncident) => boolean;
  incident?: HistoricalIncident;
  immediate?: boolean;
  sign?: boolean;
  lifeHooks?: HistoricalIncidentLifeHooks;
}

export type HistoricalIncidentReportProcessor = (incidentReport: HistoricalIncidentReport) => void;
