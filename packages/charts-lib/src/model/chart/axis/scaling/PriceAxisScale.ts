import PriceLog10Scaling from '@/model/chart/axis/scaling/PriceLog10Scaling';
import PriceRegularScaling from '@/model/chart/axis/scaling/PriceRegularScaling';
import type { PriceScalingFunction } from '@/model/chart/axis/scaling/PriceScalingFunction';
import type { Price, Range } from '@/model/chart/types';
import { formatPriceNumber, linearPriceTicks, logarithmicPriceTicks, nearestPriceStep } from '@/model/chart/axis/scaling/price-ticks';

export interface PriceScaleContext {
  /** Close of the first visible bar in the pane's primary price series. */
  referencePrice?: Price;
}

export default interface PriceAxisScale {
  id: string;
  title: string;
  func: PriceScalingFunction;
  ticks?: (range: Range<Price>, count: number, context: PriceScaleContext) => Price[];
  format?: (value: Price, step: number, context: PriceScaleContext) => string;
}

const regularFunction = new PriceRegularScaling();

export const PriceScales: Record<string, PriceAxisScale> = {
  regular: {
    id: 'regular',
    title: 'Regular',
    func: regularFunction,
  },
  log10: {
    id: 'log10',
    title: 'Log(10)',
    func: new PriceLog10Scaling(),
    ticks: logarithmicPriceTicks,
    // Local tick steps differ across the log axis; one global precision can alter a tick's price.
    format: value => Number.isFinite(value) ? String(value) : '—',
  },
  percentage: {
    id: 'percentage',
    title: 'Percentage',
    // Relative percentages are affine: retain raw-price geometry and data.
    func: regularFunction,
    ticks: (range, count, { referencePrice: base }) => {
      if (base === undefined || !Number.isFinite(base) || base === 0) return [];
      const divisor = Math.abs(base);
      const from = (range.from - base) / divisor * 100 as Price;
      const to = (range.to - base) / divisor * 100 as Price;
      return linearPriceTicks({ from, to }, count).map(value => base + value / 100 * divisor as Price);
    },
    format: (value, step, { referencePrice: base }) => {
      if (base === undefined || !Number.isFinite(base) || base === 0) return '—';
      const percent = (value - base) / Math.abs(base) * 100;
      const caption = formatPriceNumber(percent, nearestPriceStep(step / Math.abs(base) * 100));
      return `${percent > 0 && Number(caption) !== 0 ? '+' : ''}${caption}%`;
    },
  },
};
