import { TimePeriods, type OHLCv, type OHLCvRecord, type Price, type UTCTimestamp } from 'blackswan-charts';

export const HOUR = 3_600_000;
export const START = Date.UTC(2026, 0, 5);
export const time = (bar: number) => (START + bar * HOUR) as UTCTimestamp;

/** Fixed synthetic series: examples work offline and reset to the same state. */
export function marketData(): OHLCv {
  let previous = 100;
  const values: OHLCvRecord[] = Array.from({ length: 120 }, (_, i) => {
    const close = 100 + i * 0.42 + Math.sin(i * 0.21) * 9 + Math.sin(i * 0.83) * 2;
    const open = previous;
    previous = close;
    return [
      open as Price,
      (Math.max(open, close) + 1.4 + (i % 3)) as Price,
      (Math.min(open, close) - 1.2 - (i % 2)) as Price,
      close as Price,
      100 + ((i * 73) % 300),
    ];
  });
  return { loaded: { from: time(0), to: time(120) }, available: { from: time(0), to: time(120) }, step: TimePeriods.h1, values };
}
