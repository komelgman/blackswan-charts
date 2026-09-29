import { type OHLCvRecord, type Price } from 'blackswan-charts';
import { marketData, time } from '@demo/gallery/data';
import { trend, lineStyle, marketScene, type ExampleScene } from '@demo/gallery/scene';
export default function create(): ExampleScene {
  const { chart, source } = marketScene();
  const axis = chart.paneModel('main').priceAxis;
  axis.range = { from: 10 as Price, to: 1400 as Price };
  // Spread the synthetic prices across orders of magnitude to expose log curvature.
  const expandPrice = (price: Price) => (20 * 40 ** ((price - 100) / 50)) as Price;
  const content = marketData();
  content.values = content.values.map(([open, high, low, close, volume]): OHLCvRecord => [
    expandPrice(open), expandPrice(high), expandPrice(low), expandPrice(close), volume,
  ]);
  source.beginTransaction();
  source.update('OHLCv1', { data: { content } });
  source.add({
    id: 'Line1', type: 'Line', visible: true, locked: false,
    data: { ...trend(), def: [time(10), 20 as Price, time(110), 1000 as Price] },
  });
  source.add({
    id: 'HLine1',
    type: 'HLine',
    visible: true,
    locked: false,
    data: { def: 200 as Price, style: { ...lineStyle, color: '#8faee0', fill: 2 } },
  });
  source.add({
    id: 'VLine1',
    type: 'VLine',
    visible: true,
    locked: false,
    data: { def: time(70), style: { ...lineStyle, color: '#d68078', fill: 1 } },
  });
  source.endTransaction();
  chart.clearHistory();
  return {
    chart,
    note: 'Switch to Logarithmic: the straight price line from 20 to 1,000 becomes a curve. '
      + 'Drag its handles or Ctrl-drag to copy; its coordinates stay in the linear price scale.',
    actions: [
      { label: 'Linear', run: () => { axis.scale = 'regular'; } },
      { label: 'Logarithmic', run: () => { axis.scale = 'log10'; } },
    ],
  };
}
