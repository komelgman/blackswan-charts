import { type Channel } from 'blackswan-charts';
import { trend, marketScene, type ExampleScene } from '@demo/gallery/scene';
export default function create(): ExampleScene {
  const { chart, source } = marketScene();
  source.beginTransaction();
  const data: Channel = { ...trend(), offset: 18 };
  source.add({ id: 'Channel1', type: 'Channel', visible: true, locked: false, data });
  source.endTransaction();
  chart.clearHistory();
  return {
    chart,
    note: 'Drag either boundary to move the channel. The middle handle changes width; endpoint handles change the slope.',
    actions: [
      {
        label: 'Widen channel',
        run() {
          const offset = source.get<Channel>('Channel1').descriptor.options.data.offset;
          source.beginTransaction();
          source.update('Channel1', { data: { offset: offset + 3 } });
          source.endTransaction();
        },
      },
    ],
  };
}
