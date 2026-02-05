import { describe, expect, it } from 'vitest';
import PriceLog10Scaling from '@/model/chart/axis/scaling/PriceLog10Scaling';
import PriceRegularScaling from '@/model/chart/axis/scaling/PriceRegularScaling';
import type { Price } from '@/model/chart/types';

describe('Price axis scaling', () => {
  it('log10 translate/revert round trip', () => {
    const scaling = new PriceLog10Scaling();
    const values = [1, 10, 100, 1000] as Price[];

    values.forEach((value) => {
      const translated = scaling.translate(value);
      const reverted = scaling.revert(translated);
      expect(reverted).toBeCloseTo(value);
    });
  });

  it('regular translate/revert round trip', () => {
    const scaling = new PriceRegularScaling();
    const values = [-10, 0, 25.5, 100] as Price[];

    values.forEach((value) => {
      const translated = scaling.translate(value);
      const reverted = scaling.revert(translated);
      expect(reverted).toBeCloseTo(value);
    });
  });
});
