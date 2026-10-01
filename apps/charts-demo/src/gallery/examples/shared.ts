import { ControlMode, LineFillStyle, LineBound, PriceScales, type Price } from 'blackswan-charts';
import { marketData, time } from '@demo/gallery/data';
import { marketPane, marketScene, type ExampleScene } from '@demo/gallery/scene';
export default function create(): ExampleScene {
  const { chart, source } = marketScene();
  const lineStyle = { color: '#e2b77c', lineWidth: 2 as const, fill: LineFillStyle.Solid };
  const line = { scale: PriceScales.regular, boundType: LineBound.Both, style: lineStyle };
  source.beginTransaction();
  const comparison = marketPane(chart, 'comparison', 'regular', false, marketData('falling'));
  source.add({
    id: 'HLine1',
    type: 'HLine',
    visible: true,
    locked: false,
    shareWith: '*',
    data: { def: 125 as Price, style: lineStyle },
  });
  source.add({
    id: 'VLine1', type: 'VLine', visible: true, locked: false, shareWith: '*',
    data: { def: time(68), style: { ...lineStyle, fill: LineFillStyle.Dotted } },
  });
  source.add({
    id: 'Line1', type: 'Line', visible: true, locked: false, shareWith: '*',
    data: { ...line, def: [time(20), 102 as Price, time(95), 142 as Price], style: { ...lineStyle, fill: LineFillStyle.Dashed } },
  });
  source.add({
    id: 'VLine2', type: 'VLine', visible: true, locked: false,
    data: { def: time(30), style: { ...lineStyle, color: '#8faee0', fill: LineFillStyle.LargeDashed } },
  });
  source.add({
    id: 'Line2', type: 'Line', visible: true, locked: false,
    data: { ...line, def: [time(12), 160 as Price, time(54), 135 as Price], style: { ...lineStyle, color: '#8faee0' } },
  });
  comparison.add({
    id: 'VLine2', type: 'VLine', visible: true, locked: false,
    data: { def: time(95), style: { ...lineStyle, color: '#d68078', fill: LineFillStyle.LargeDashed } },
  });
  comparison.add({
    id: 'Line2', type: 'Line', visible: true, locked: false,
    data: { ...line, def: [time(45), 154 as Price, time(110), 104 as Price], style: { ...lineStyle, color: '#d68078' } },
  });
  source.endTransaction();
  chart.clearHistory();
  return {
    chart,
    start() {
      chart.timeAxis.noHistoryManagedUpdate({ controlMode: ControlMode.MANUAL, range: { from: time(-4), to: time(125) } });
    },
    note: 'Amber level, time marker and diagonal are shared: drag any of them in either market. '
      + 'Blue lines belong only to the top pane; coral lines only to the bottom. Undo reverses the edit in both views.',
  };
}
