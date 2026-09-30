import { TimePeriods, type OHLCv, type OHLCvRecord, type Price, type UTCTimestamp } from 'blackswan-charts';

export const HOUR = 3_600_000;
export const START = Date.UTC(2026, 0, 5);
export const time = (bar: number) => (START + bar * HOUR) as UTCTimestamp;

export type MarketSeries = 'rising' | 'falling';

function closePrice(i: number, series: MarketSeries): number {
  return series === 'rising'
    ? 100 + i * 0.42 + Math.sin(i * 0.21) * 9 + Math.sin(i * 0.83) * 2
    : 155 - i * 0.38 + Math.sin(i * 0.15 + 1) * 7 + Math.cos(i * 0.61) * 3;
}

/** Deterministic bars can be generated individually for the live-feed example. */
export function marketBar(i: number, series: MarketSeries = 'rising'): OHLCvRecord {
  const close = closePrice(i, series);
  const open = i === 0 ? close : closePrice(i - 1, series);
  return [
    open as Price,
    (Math.max(open, close) + 1.4 + (i % 3)) as Price,
    (Math.min(open, close) - 1.2 - (i % 2)) as Price,
    close as Price,
    100 + ((i * 73) % 300),
  ];
}

/** Fixed synthetic series: examples work offline and reset to the same state. */
export function marketData(series: MarketSeries = 'rising', count = 120): OHLCv {
  const values = Array.from({ length: count }, (_, i) => marketBar(i, series));
  return { loaded: { from: time(0), to: time(count) }, available: { from: time(0), to: time(count) }, step: TimePeriods.h1, values };
}
