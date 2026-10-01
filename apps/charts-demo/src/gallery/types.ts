import type { Chart } from 'blackswan-charts';

export interface ExampleAction {
  label: string;
  run(): void;
}

export interface ObjectEventDetails {
  sourceId: string;
  drawingId: string;
  drawingType: string;
  event: 'click' | 'dblclick';
  handle?: string;
  x: number;
  y: number;
}

export interface ExampleScene {
  chart: Chart;
  actions?: ExampleAction[];
  note: string;
  readonly status?: string;
  readonly objectEvent?: ObjectEventDetails;
  start?(): void;
  dispose?(): void;
}
