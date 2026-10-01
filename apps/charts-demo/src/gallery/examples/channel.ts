import { LineBound, LineFillStyle, PriceScales, type Channel, type Price } from 'blackswan-charts';
import { time } from '@demo/gallery/data';
import { marketScene, type ExampleScene } from '@demo/gallery/scene';
export default function create(): ExampleScene {
  const { chart, source } = marketScene();
  source.beginTransaction();
  const data: Channel = {
    def: [time(20), 102 as Price, time(95), 142 as Price],
    scale: PriceScales.regular,
    boundType: LineBound.Both,
    style: { color: '#e2b77c', lineWidth: 2, fill: LineFillStyle.Solid },
    offset: 18,
  };
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
