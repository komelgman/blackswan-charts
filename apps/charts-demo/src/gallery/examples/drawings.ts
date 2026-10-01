import { LineFillStyle, LineBound, PriceScales, type Price } from 'blackswan-charts';
import { marketData, time } from '@demo/gallery/data';
import { marketScene, type ExampleScene } from '@demo/gallery/scene';
export default function create(): ExampleScene {
  const { chart, source } = marketScene(false, marketData('wide'));
  const lineStyle = { color: '#e2b77c', lineWidth: 2 as const, fill: LineFillStyle.Solid };
  const line = { scale: PriceScales.regular, boundType: LineBound.Both, style: lineStyle };
  const axis = chart.paneModel('main').priceAxis;
  source.beginTransaction();
  source.add({
    id: 'Line1', type: 'Line', visible: true, locked: false,
    data: { ...line, def: [time(10), 20 as Price, time(110), 1000 as Price] },
  });
  source.add({
    id: 'Line2', type: 'Line', visible: true, locked: false,
    data: { ...line, def: [time(18), 1180 as Price, time(106), 600 as Price],
      style: { ...lineStyle, color: '#b5a0d5', fill: LineFillStyle.LargeDashed } },
  });
  source.add({
    id: 'Line3', type: 'Line', visible: true, locked: false,
    data: { ...line, def: [time(12), 420 as Price, time(78), 880 as Price],
      style: { ...lineStyle, color: '#83bca8', fill: LineFillStyle.SparseDotted } },
  });
  source.add({
    id: 'HLine1',
    type: 'HLine',
    visible: true,
    locked: false,
    data: { def: 200 as Price, style: { ...lineStyle, color: '#8faee0', fill: LineFillStyle.Dashed } },
  });
  source.add({
    id: 'VLine1',
    type: 'VLine',
    visible: true,
    locked: false,
    data: { def: time(70), style: { ...lineStyle, color: '#d68078', fill: LineFillStyle.Dotted } },
  });
  source.endTransaction();
  chart.clearHistory();
  return {
    chart,
    note: 'Solid, dashed, dotted, long-dashed and sparse-dotted lines. Switch to Logarithmic to see straight price lines curve. '
      + 'Drag a line or its handles; Ctrl-drag creates a copy.',
    actions: [
      { label: 'Linear', run: () => { axis.scale = 'regular'; } },
      { label: 'Logarithmic', run: () => { axis.scale = 'log10'; } },
    ],
  };
}
