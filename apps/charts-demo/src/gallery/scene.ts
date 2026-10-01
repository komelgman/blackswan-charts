import {
  Chart,
  DataSource,
  Themes,
  ControlMode,
  type CandlestickPlot,
  type ColumnsVolumeIndicator,
  type DrawingOptions,
  type OHLCv,
} from 'blackswan-charts';
import { HOUR, marketData } from '@demo/gallery/data';
export type { ExampleAction, ExampleScene } from '@demo/gallery/types';

export function marketPane(chart: Chart, id: string, content: OHLCv = marketData(), volume = false): DataSource {
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
    priceAxis: { primaryEntry: 'OHLCv1', controlMode: ControlMode.AUTO },
  });
  return source;
}

export function marketScene(volume = false, content: OHLCv = marketData()) {
  const chart = new Chart(undefined, { theme: Themes.DARK });
  const source = marketPane(chart, 'main', content, volume);
  // AUTO follows new bars; justfollow preserves this initial window when it does.
  chart.timeAxis.noHistoryManagedUpdate({
    range: { from: content.loaded.from, to: (content.loaded.to + 20 * HOUR) as typeof content.loaded.to },
    controlMode: ControlMode.AUTO,
    justfollow: true,
  });
  chart.clearHistory();
  return { chart, source };
}
