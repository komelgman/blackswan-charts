import { ref } from 'vue';
import { ControlMode, type CandlestickPlot, type OHLCv } from 'blackswan-charts';
import { marketBar, marketData, time } from '@demo/gallery/data';
import { marketScene, type ExampleScene } from '@demo/gallery/scene';

export default function create(): ExampleScene {
  const count = ref(80);
  const running = ref(false);
  const { chart, source } = marketScene(true, marketData('rising', count.value));
  let timer: ReturnType<typeof setInterval> | undefined;

  const follows = () => chart.timeAxis.controlMode.value === ControlMode.AUTO;

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

  chart.clearHistory();
  return {
    chart,
    start,
    dispose: stop,
    get status() { return `${count.value} bars received · ${running.value ? 'Running' : 'Paused'}`; },
    note: 'A new synthetic candle and volume bar arrive every second. Pause or add one manually. '
      + 'Pan to stop following; Follow resumes from the latest bar and keeps your zoom. Price fitting is automatic. '
      + 'Incoming data does not fill undo history.',
    actions: [
      { get label() { return running.value ? 'Pause feed' : 'Resume feed'; }, run: () => { if (running.value) stop(); else start(); } },
      { label: 'Add one bar', run: append },
      {
        get label() { return `Follow: ${follows() ? 'on' : 'off'}`; },
        run() {
          chart.timeAxis.noHistoryManagedUpdate({ controlMode: follows() ? ControlMode.MANUAL : ControlMode.AUTO, justfollow: true });
        },
      },
    ],
  };
}
