import { ChartSerializer, ChartDeserializer, LineFillStyle, type HLine, type Price } from 'blackswan-charts';
import { marketScene, type ExampleScene } from '@demo/gallery/scene';
export default function create(): ExampleScene {
  const { chart, source } = marketScene();
  source.beginTransaction();
  source.add({
    id: 'HLine1', type: 'HLine', visible: true, locked: false,
    data: { def: 120 as Price, style: { color: '#e2b77c', lineWidth: 2, fill: LineFillStyle.Solid } },
  });
  source.endTransaction();
  chart.clearHistory();
  const initial = JSON.stringify(new ChartSerializer().serialize(chart));
  return {
    chart,
    note: 'Move the level, undo, redo, or restore the saved chart. Restore itself is also one undoable action.',
    actions: [
      {
        label: 'Move level +5',
        run() {
          const ds = chart.paneModel('main').dataSource;
          const price = ds.get<HLine>('HLine1').descriptor.options.data.def;
          ds.beginTransaction();
          ds.update('HLine1', { data: { def: price + 5 } });
          ds.endTransaction();
        },
      },
      { label: 'Restore saved chart', run: () => new ChartDeserializer().deserialize(chart, JSON.parse(initial)) },
    ],
  };
}
