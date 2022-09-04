import {
  ContextMenuOptionsProvider,
  MenuItem,
} from '@/components/context-menu/ContextMenuOptions';
import PriceScale, { PriceScales } from '@/model/axis/scaling/PriceScale';
import PriceAxis from '@/model/axis/PriceAxis';
import TimeVarianceAuthority from '@/model/history/TimeVarianceAuthority';
import UpdatePriceAxisInverted from '@/model/axis/incidents/UpdatePriceAxisInverted';
import UpdatePriceAxisScale from '@/model/axis/incidents/UpdatePriceAxisScale';
import { reactive, watch } from 'vue';
import { merge } from '@/misc/strict-type-checks';

export default class PriceAxisContextMenu implements ContextMenuOptionsProvider {
  private readonly axis: PriceAxis;
  private readonly tva: TimeVarianceAuthority;
  private readonly menu: MenuItem[];

  public constructor(tva: TimeVarianceAuthority, axis: PriceAxis) {
    this.tva = tva;
    this.axis = axis;

    this.menu = reactive(this.createMenu());

    watch(
      [this.axis.inverted, this.axis.scale],
      () => { merge(this.menu, this.createMenu()) },
    );
  }

  private createMenu(): MenuItem[] {
    const { axis } = this;
    const isInverted: boolean = this.axis.inverted.value === 1;
    const isRegularScale: boolean = axis.scale.title === 'Regular';
    const isLog10Scale: boolean = axis.scale.title === 'Log(10)';

    return [
      {
        type: 'checkbox',
        title: 'Invert scale',
        checked: isInverted,
        onclick: this.updateInvertedHandler.bind(this),
      },
      {
        type: 'checkbox',
        title: 'Scale - Regular',
        checked: isRegularScale,
        onclick: () => this.updateScaleHandler(PriceScales.regular),
      },
      {
        type: 'checkbox',
        title: 'Scale - Log(10)',
        checked: isLog10Scale,
        onclick: () => this.updateScaleHandler(PriceScales.log10),
      },
    ];
  }

  public contextmenu(): MenuItem[] {
    return this.menu;
  }

  private updateInvertedHandler(): void {
    const { axis } = this;
    this.tva
      .getProtocol({ incident: 'price-axis-update-inverted' })
      .addIncident(new UpdatePriceAxisInverted({
        axis,
        inverted: { value: axis.inverted.value > 0 ? -1 : 1 },
      }))
      .trySign();
  }

  private updateScaleHandler(scale: PriceScale): void {
    const { axis } = this;
    this.tva
      .getProtocol({ incident: 'price-axis-update-scale' })
      .addIncident(new UpdatePriceAxisScale({
        axis,
        scale,
      }))
      .trySign();
  }
}
