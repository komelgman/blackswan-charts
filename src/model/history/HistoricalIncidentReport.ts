import type {
  HistoricalIncident,
  HistoricalIncidentLifeHooks,
  HistoricalProtocolOptions,
} from '@/model/history';

export interface HistoricalIncidentReport {
  protocolOptions: HistoricalProtocolOptions;
  skipIf?: (incident: HistoricalIncident) => boolean;
  incident?: HistoricalIncident;
  immediate?: boolean;
  sign?: boolean;
  lifeHooks?: HistoricalIncidentLifeHooks;
}

export type HistoricalIncidentReportProcessor = (incidentReport: HistoricalIncidentReport) => void;
