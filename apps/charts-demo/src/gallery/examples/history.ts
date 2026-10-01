import { ChartSerializer, ChartDeserializer, LineFillStyle, type HLine, type Price } from 'blackswan-charts';
import { marketScene, type ExampleScene } from '@demo/gallery/scene';
export default function create(): ExampleScene {
  const { chart, source } = marketScene();
  source.beginTransaction();
  for (const [index, price] of [120, 135].entries()) {
    source.add({
      id: `HLine${index + 1}`, type: 'HLine', visible: true, locked: false,
      data: { def: price as Price, style: { color: '#e2b77c', lineWidth: 2, fill: LineFillStyle.Solid } },
    });
  }
  source.endTransaction();
  chart.clearHistory();
  const initial = JSON.stringify(new ChartSerializer().serialize(chart));
  return {
    chart,
    note: 'Move both levels in one transaction, then undo them together. Restore the saved JSON chart; restoring is also undoable.',
    actions: [
      {
        label: 'Move levels +5',
        run() {
          const ds = chart.paneModel('main').dataSource;
          ds.beginTransaction();
          for (const id of ['HLine1', 'HLine2']) {
            const price = ds.get<HLine>(id).descriptor.options.data.def;
            ds.update(id, { data: { def: price + 5 } });
          }
          ds.endTransaction();
        },
      },
      { label: 'Restore saved chart', run: () => new ChartDeserializer().deserialize(chart, JSON.parse(initial)) },
    ],
  };
}
