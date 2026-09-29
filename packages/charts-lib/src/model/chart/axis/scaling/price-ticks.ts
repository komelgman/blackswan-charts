import type { Price, Range } from '@/model/chart/types';
import math from '@/model/misc/math';

const DECIMAL_STEPS = [1, 2, 2.5, 5, 10];

/** Smallest readable decimal step that leaves room for the requested labels. */
export function nicePriceStep(span: number, count: number): number {
  const raw = Math.abs(span) / Math.max(1, count);
  if (!Number.isFinite(raw) || raw === 0) return 1;
  const power = 10 ** Math.floor(Math.log10(raw));
  // Subtraction of nearby prices can put an exact decimal step just above its boundary.
  return (DECIMAL_STEPS.find(v => v * power >= raw * (1 - 1e-12)) ?? 10) * power;
}

/** Recover a known decimal tick step after a lossy price/reference conversion. */
export function nearestPriceStep(step: number): number {
  if (!Number.isFinite(step) || step <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(step));
  const normalized = step / power;
  return DECIMAL_STEPS.reduce((best, value) => Math.abs(value - normalized) < Math.abs(best - normalized) ? value : best) * power;
}

export function formatPriceNumber(value: number, step: number): string {
  if (!Number.isFinite(value)) return '—';
  const exponent = Math.floor(Math.log10(Math.abs(step) || 1));
  const normalized = step / 10 ** exponent;
  const extraDigit = Math.abs(normalized - 2.5) < 1e-8 ? 1 : 0;
  const fraction = Math.max(0, -exponent + extraDigit);
  if (Math.abs(value) >= 1e15 || fraction > 20) {
    const digits = Math.max(1, Math.min(17, Math.floor(Math.log10(Math.abs(value) || 1)) - exponent + extraDigit + 1));
    return value.toPrecision(digits);
  }
  const rounded = Number(value.toFixed(fraction));
  return (Object.is(rounded, -0) ? 0 : rounded).toFixed(fraction);
}

export function linearPriceTicks(range: Range<Price>, count: number): Price[] {
  const { from, to } = range;
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from || count < 1) return [];
  const step = nicePriceStep(to - from, Math.min(count, 1000));
  const first = Math.ceil(from / step);
  const last = Math.floor(to / step);
  const result: Price[] = [];
  for (let index = 0; index <= Math.min(1000, last - first); index++) {
    const value = Number(formatPriceNumber((first + index) * step, step));
    if (value >= from && value <= to && value !== result[result.length - 1]) result.push(value as Price);
  }
  return result;
}

/** Prefer the coarsest decimal price within 10% of an ideal grid position. */
function roundedLogTick(target: number, pitch: number): Price {
  const price = math.exp10(target);
  if (price === 0) return 0 as Price;
  const exponent = Math.floor(Math.log10(Math.abs(price)));
  // At most the significant digits of a double, independently of its magnitude.
  for (let digit = 0; digit < 17; digit++) {
    const power = 10 ** (exponent - digit);
    for (const multiple of [5, 2.5, 2, 1]) {
      const step = multiple * power;
      const value = Number(formatPriceNumber(Math.round(price / step) * step, step));
      if (Number.isFinite(value) && Math.abs(math.log10(value) - target) <= pitch * 0.1) return value as Price;
    }
  }
  return price as Price;
}

/** Round an evenly spaced transformed grid, instead of greedily packing local ticks.
 * The 1.5x spacing budget leaves room for rounding without collision thinning.
 * A zero anchor and discrete sqrt(2) pitch levels keep prices stable during pan/zoom.
 */
export function logarithmicPriceTicks(range: Range<Price>, count: number): Price[] {
  const { from, to } = range;
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from || !Number.isFinite(count) || count < 1) return [];
  const start = math.log10(from);
  const span = math.log10(to) - start;
  const intervals = Math.max(1, Math.min(1000, count) / 1.5);
  const desiredPitch = span / intervals;
  // Quantize in transformed space: continuous span/intervals rephases every tick on each wheel event.
  // Half-octaves limit the density change to sqrt(2), preserving coverage and rounded gap uniformity.
  const pitch = 2 ** (Math.ceil(2 * Math.log2(desiredPitch) - 1e-10) / 2);
  if (!(pitch > 0)) return [];
  const first = Math.ceil(start / pitch);
  const values = new Set<Price>();
  for (let index = 0; index <= intervals; index++) {
    const value = roundedLogTick((first + index) * pitch, pitch);
    if (value >= from && value <= to) values.add(value);
  }
  return Array.from(values).sort((a, b) => a - b);
}
