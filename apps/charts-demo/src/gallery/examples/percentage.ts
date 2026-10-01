import {
  Chart, ControlMode, DataSource, Themes, type CandlestickPlot, type DrawingOptions, type OHLCv, type Price,
} from 'blackswan-charts';
import { HOUR, marketData } from '@demo/gallery/data';
import type { ExampleScene } from '@demo/gallery/types';

export default function create(): ExampleScene {
  const chart = new Chart(undefined, { theme: Themes.DARK });
  const primaryData = marketData();
  const lowVolatility: OHLCv = {
    ...primaryData,
    values: primaryData.values.map(([open, high, low, close, volume]) => {
      const compress = (price: Price) => (120 + (price - 125) / 5) as Price;
      return [compress(open), compress(high), compress(low), compress(close), volume];
    }),
  };
  const markets = [
    { id: 'main', label: 'Primary · rising', color: '#e2b77c', content: primaryData },
    { id: 'comparison', label: 'Comparison · falling', color: '#8faee0', content: marketData('falling') },
    { id: 'third', label: 'Third · low volatility', color: '#b5a0d5', content: lowVolatility },
  ];
  const sources = markets.map(({ id, color, content }) => {
    const candles: DrawingOptions<CandlestickPlot> = {
      id: 'OHLCv1', type: 'OHLCv', visible: true, locked: true,
      data: {
        content,
        plotOptions: {
          type: 'CandlestickPlot',
          barStyle: {
            showBody: true, showWick: true, showBorder: false,
            bullish: { body: color, border: color, wick: color },
            bearish: { body: color, border: color, wick: color },
          },
        },
      },
    };
    return new DataSource({ id, idHelper: chart.idHelper }, [candles]);
  });
  const primaryEntryRef = { ds: sources[0], entryRef: 'OHLCv1' };
  for (const source of sources) {
    chart.createPane(source, {
      priceAxis: { primaryEntry: 'OHLCv1', scale: 'percentage', controlMode: ControlMode.AUTO },
    });
    chart.paneModel(source.id).priceAxis.noHistoryManagedUpdate({ primaryEntryRef });
  }
  chart.timeAxis.noHistoryManagedUpdate({
    range: { from: primaryData.loaded.from, to: (primaryData.loaded.to + 20 * HOUR) as typeof primaryData.loaded.to },
    controlMode: ControlMode.AUTO,
    justfollow: true,
  });
  chart.clearHistory();
  return {
    chart,
    legend: markets.map(({ label, color }) => ({ label, color })),
    get status() {
      const base = chart.paneModel('main').priceAxis.referencePrice.value;
      return base === undefined ? 'No visible primary bar' : `0% = ${base.toFixed(2)} · primary first visible close`;
    },
    note: 'Three independent sources share the first visible close of the amber primary series as 0%. '
      + 'Pan to change that common reference. The primary series also supplies the automatic price range for all three panes.',
  };
}
