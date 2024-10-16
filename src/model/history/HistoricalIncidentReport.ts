import type {
  HistoricalIncident,
  HistoricalIncidentLifeHooks,
} from '@/model/history/HistoricalIncident';
import type { HistoricalProtocolOptions } from '@/model/history/History';

export interface HistoricalIncidentReport {
  protocolOptions: HistoricalProtocolOptions;
  skipIf?: (incident: HistoricalIncident) => boolean;
  incident?: HistoricalIncident;
  immediate?: boolean;
  sign?: boolean;
  lifeHooks?: HistoricalIncidentLifeHooks;
}

export type HistoricalIncidentReportProcessor = (incidentReport: HistoricalIncidentReport) => void;
