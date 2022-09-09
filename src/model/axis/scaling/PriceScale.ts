import PriceLog10Scaling from '@/model/axis/scaling/PriceLog10Scaling';
import PriceRegularScaling from '@/model/axis/scaling/PriceRegularScaling';
import { PriceScalingFunction } from '@/model/axis/scaling/PriceScalingFunction';

export default interface PriceScale {
  title: string;
  func: PriceScalingFunction;
}

export const PriceScales: Record<string, PriceScale> = {
  regular: {
    title: 'Regular',
    func: new PriceRegularScaling(),
  },
  log10: {
    title: 'Log(10)',
    func: new PriceLog10Scaling(),
  },
};
