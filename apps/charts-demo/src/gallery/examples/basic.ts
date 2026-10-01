import { Chart, ControlMode, DataSource, Themes, type CandlestickPlot, type DrawingOptions } from 'blackswan-charts';
import { marketData } from '@demo/gallery/data';
import type { ExampleScene } from '@demo/gallery/types';

export default function create(): ExampleScene {
  const chart = new Chart(undefined, { theme: Themes.DARK });
  const candles: DrawingOptions<CandlestickPlot> = {
    id: 'OHLCv1', type: 'OHLCv', visible: true, locked: true,
    data: {
      content: marketData(),
      plotOptions: {
        type: 'CandlestickPlot',
        // Plot colors are currently required by the API; chart/grid/text styles come from the theme.
        barStyle: {
          showBody: true, showWick: true, showBorder: false,
          bullish: { body: '#68c5b3', border: '#68c5b3', wick: '#68c5b3' },
          bearish: { body: '#d68078', border: '#d68078', wick: '#d68078' },
        },
      },
    },
  };
  const source = new DataSource({ id: 'main', idHelper: chart.idHelper }, [candles]);
  chart.createPane(source, { priceAxis: { primaryEntry: 'OHLCv1', controlMode: ControlMode.AUTO } });
  chart.timeAxis.noHistoryManagedUpdate({ range: candles.data.content!.available, controlMode: ControlMode.AUTO, justfollow: true });
  chart.clearHistory();
  return { chart, note: 'Create a Chart, put prices in a DataSource, add a pane, and render ChartWidget in a sized container. '
    + 'Scroll to zoom, drag to pan, and right-click an axis for its options.' };
}
