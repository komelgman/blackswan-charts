import {
  Chart,
  DataSource,
  Themes,
  ControlMode,
  PriceScales,
  LineBound,
  type CandlestickPlot,
  type ColumnsVolumeIndicator,
  type DrawingOptions,
  type Line,
  type Price,
  type OHLCv,
} from 'blackswan-charts';
import { marketData, time } from '@demo/gallery/data';

export interface ExampleAction {
  label: string;
  run(): void;
}
export interface ExampleScene {
  chart: Chart;
  actions?: ExampleAction[];
  note: string;
  readonly status?: string;
  start?(): void;
  dispose?(): void;
}
export const lineStyle = { color: '#e2b77c', lineWidth: 2 as const, fill: 0 };

export function marketPane(chart: Chart, id: string, scale = 'regular', volume = false, content: OHLCv = marketData()): DataSource {
  const candles: DrawingOptions<CandlestickPlot> = {
    id: 'OHLCv1',
    type: 'OHLCv',
    locked: true,
    visible: true,
    data: {
      content,
      plotOptions: {
        type: 'CandlestickPlot',
        barStyle: {
          showBody: true,
          showWick: true,
          showBorder: false,
          bullish: { body: '#68c5b3', border: '#68c5b3', wick: '#68c5b3' },
          bearish: { body: '#d68078', border: '#d68078', wick: '#d68078' },
        },
      },
    },
  };
  const drawings: DrawingOptions[] = [];
  if (volume) {
    const bars: DrawingOptions<ColumnsVolumeIndicator> = {
      id: 'OHLCv2',
      type: 'OHLCv',
      locked: true,
      visible: true,
      data: {
        content,
        plotOptions: {
          type: 'VolumeIndicator',
          heightFactor: 0.17,
          style: {
            type: 'Columns',
            bullish: { body: '#285b56', border: '#285b56' },
            bearish: { body: '#673e41', border: '#673e41' },
          },
        },
      },
    };
    drawings.push(bars);
  }
  drawings.push(candles);
  const source = new DataSource({ id, idHelper: chart.idHelper }, drawings);
  chart.createPane(source, {
    priceAxis: { primaryEntry: 'OHLCv1', scale, controlMode: ControlMode.MANUAL, range: { from: 80 as Price, to: 175 as Price } },
  });
  return source;
}

export function marketScene(volume = false, content: OHLCv = marketData()) {
  const chart = new Chart(undefined, { theme: Themes.DARK });
  chart.updateStyle({
    backgroundColor: '#111c22',
    borderColor: '#26343b',
    viewport: { backgroundColor: '#111c22', gridColor: '#223138' },
  });
  const source = marketPane(chart, 'main', 'regular', volume, content);
  chart.timeAxis.range = { from: time(-4), to: time(125) };
  chart.clearHistory();
  return { chart, source };
}

export function trend(): Line {
  return {
    def: [time(20), 102 as Price, time(95), 142 as Price],
    scale: PriceScales.regular,
    boundType: LineBound.Both,
    style: { ...lineStyle },
  };
}

export function addTrend(source: DataSource): void {
  source.add({ id: 'Line1', type: 'Line', data: trend(), visible: true, locked: false });
}
