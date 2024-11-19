import { reactive, watch } from 'vue';
import type { ContextMenuOptionsProvider, MenuItem } from '@/components/context-menu/types';
import type { PriceAxis } from '@/model/chart/axis/PriceAxis';
import type PriceAxisScale from '@/model/chart/axis/scaling/PriceAxisScale';
import { PriceScales } from '@/model/chart/axis/scaling/PriceAxisScale';

export default class PriceAxisContextMenu implements ContextMenuOptionsProvider {
  private readonly axis: PriceAxis;
  private readonly menu: MenuItem[];

  public constructor(axis: PriceAxis) {
    this.axis = axis;

    this.menu = reactive(this.createMenu());

    watch(
      [this.axis.inverted, this.axis.scale],
      () => {
        Object.assign(this.menu, this.createMenu());
      },
    );
  }

  private createMenu(): MenuItem[] {
    const { axis } = this;
    const isInverted: boolean = this.axis.inverted.value === 1;
    const isRegularScale: boolean = axis.scale.id === 'regular';
    const isLog10Scale: boolean = axis.scale.id === 'log10';

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
    this.axis.invert();
  }

  private updateScaleHandler(scale: PriceAxisScale): void {
    this.axis.scale = scale.id;
  }
}
