import { ContextMenuOptionsProvider, MenuItem } from '@/components/context-menu/ContextMenuOptions';
import { PriceScales } from '@/model/axis/scaling/PriceScale';
import PriceAxis from '@/model/axis/PriceAxis';
import TimeVarianceAuthority from '@/model/history/TimeVarianceAuthority';

export default class PriceAxisContextMenu implements ContextMenuOptionsProvider {
  private axis: PriceAxis;
  private tva: TimeVarianceAuthority;

  public constructor(tva: TimeVarianceAuthority, axis: PriceAxis) {
    this.tva = tva;
    this.axis = axis;
  }

  public contextmenu(): MenuItem[] {
    const { axis } = this;
    const inverted: boolean = axis.inverted.value === 1;
    const isRegularScale: boolean = axis.scale.title === 'Regular';
    const isLog10Scale: boolean = axis.scale.title === 'Log(10)';

    return [
      {
        type: 'checkbox',
        title: 'Invert scale',
        checked: inverted,
        onclick: () => axis.update({ inverted: { value: axis.inverted.value > 0 ? -1 : 1 } }),
      },
      {
        type: 'checkbox',
        title: 'Scale - Regular',
        checked: isRegularScale,
        onclick: () => axis.update({ scale: PriceScales.regular }),
      },
      {
        type: 'checkbox',
        title: 'Scale - Log(10)',
        checked: isLog10Scale,
        onclick: () => axis.update({ scale: PriceScales.log10 }),
      },
    ];
  }
}
