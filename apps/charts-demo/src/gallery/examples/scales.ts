import { LineBound, LineFillStyle, PriceScales, type Line, type Price } from 'blackswan-charts';
import { marketScene, type ExampleScene } from '@demo/gallery/scene';
import { marketData, time } from '@demo/gallery/data';
export default function create(): ExampleScene {
  const { chart, source } = marketScene(false, marketData('wide'));
  const axis = chart.paneModel('main').priceAxis;
  const endpoints: Line['def'] = [time(8), 20 as Price, time(112), 1000 as Price];
  source.beginTransaction();
  for (const [id, scale, color, fill] of [
    ['Line1', PriceScales.regular, '#e2b77c', LineFillStyle.Solid],
    ['Line2', PriceScales.log10, '#b5a0d5', LineFillStyle.LargeDashed],
  ] as const) {
    source.add<Line>({
      id, type: 'Line', visible: true, locked: false,
      data: {
        def: [...endpoints],
        scale,
        boundType: LineBound.Both,
        style: { color, lineWidth: 2, fill },
      },
    });
  }
  source.endTransaction();
  chart.clearHistory();
  return {
    chart,
    legend: [
      { label: 'Linear trend', color: '#e2b77c' },
      { label: 'Logarithmic trend', color: '#b5a0d5', dashed: true },
    ],
    note: 'Both trends have the same endpoints. Amber is built in linear price space; lavender in logarithmic price space. '
      + 'Switch the axis: each trend is straight in its own space and curves in the other. Drag either line to edit it. '
      + 'Percentage uses the first visible close as its zero; pan to change that reference.',
    actions: [
      ['Linear', 'regular'],
      ['Logarithmic', 'log10'],
      ['Percentage', 'percentage'],
    ].map(([label, id]) => ({
      label,
      run: () => {
        axis.scale = id;
      },
    })),
  };
}
