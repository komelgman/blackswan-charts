import { ref } from 'vue';
import type { CandlestickPlot, OHLCv, Price } from 'blackswan-charts';
import { marketBar, marketData, time } from '@demo/gallery/data';
import { marketScene, type ExampleScene } from '@demo/gallery/scene';

export default function create(): ExampleScene {
  const count = ref(80);
  const running = ref(false);
  const following = ref(true);
  const { chart, source } = marketScene(true, marketData('rising', count.value));
  const axis = chart.paneModel('main').priceAxis;
  let timer: ReturnType<typeof setInterval> | undefined;

  function follow() {
    if (!following.value) return;
    chart.timeAxis.noHistoryManagedUpdate({ range: { from: time(count.value - 84), to: time(count.value + 5) } });
    const bars = source.get<CandlestickPlot>('OHLCv1').descriptor.options.data.content!.values.slice(-84);
    axis.noHistoryManagedUpdate({ range: {
      from: (Math.min(...bars.map(bar => bar[2])) - 8) as Price,
      to: (Math.max(...bars.map(bar => bar[1])) + 8) as Price,
    } });
  }

  function append() {
    const previous = source.get<CandlestickPlot>('OHLCv1').descriptor.options.data.content!;
    const values = [...previous.values, marketBar(count.value)].slice(-240);
    count.value++;
    const range = { from: time(count.value - values.length), to: time(count.value) };
    const content: OHLCv = { ...previous, values, loaded: range, available: { ...range } };
    // Feed updates are not user edits: keep undo history independent of incoming bars.
    source.noHistoryManagedEntriesProcess<CandlestickPlot>(['OHLCv1', 'OHLCv2'], entry => {
      entry.descriptor.options.data.content = content;
    });
    follow();
  }

  function stop() {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
    running.value = false;
  }

  function start() {
    if (timer !== undefined) return;
    running.value = true;
    timer = setInterval(append, 1000);
  }

  follow();
  chart.clearHistory();
  return {
    chart,
    start,
    dispose: stop,
    get status() { return `${count.value} bars received · ${running.value ? 'Running' : 'Paused'}`; },
    note: 'A new synthetic candle and volume bar arrive every second. Pause or add one manually. '
      + 'Turn Follow off to explore the chart. Reset restarts the same feed; incoming data does not fill undo history.',
    actions: [
      { get label() { return running.value ? 'Pause feed' : 'Resume feed'; }, run: () => { if (running.value) stop(); else start(); } },
      { label: 'Add one bar', run: append },
      { get label() { return `Follow: ${following.value ? 'on' : 'off'}`; }, run: () => { following.value = !following.value; follow(); } },
    ],
  };
}
