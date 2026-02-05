import PriceLog10Scaling from '@/model/chart/axis/scaling/PriceLog10Scaling';
import PriceRegularScaling from '@/model/chart/axis/scaling/PriceRegularScaling';
import type { PriceScalingFunction } from '@/model/chart/axis/scaling/PriceScalingFunction';

export default interface PriceAxisScale {
  id: keyof typeof PriceScales,
  title: string;
  func: PriceScalingFunction;
}

export const PriceScales: Record<string, PriceAxisScale> = {
  regular: {
    id: 'regular',
    title: 'Regular',
    func: new PriceRegularScaling(),
  },
  log10: {
    id: 'log10',
    title: 'Log(10)',
    func: new PriceLog10Scaling(),
  },
};
