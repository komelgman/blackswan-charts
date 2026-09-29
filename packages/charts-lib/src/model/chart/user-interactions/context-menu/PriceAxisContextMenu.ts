import { reactive, watch } from 'vue';
import type { ContextMenuOptionsProvider, MenuItem } from '@blackswan/context-menu/types';
import type { PriceAxis } from '@/model/chart/axis/PriceAxis';
import type PriceAxisScale from '@/model/chart/axis/scaling/PriceAxisScale';

export class PriceAxisContextMenu implements ContextMenuOptionsProvider {
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

    return [
      {
        type: 'checkbox',
        title: 'Invert scale',
        checked: isInverted,
        onclick: this.updateInvertedHandler.bind(this),
      },
      ...Object.values(axis.availableScales).map((scale): MenuItem => ({
        type: 'checkbox',
        title: `Scale - ${scale.title}`,
        checked: axis.scale.id === scale.id,
        onclick: () => this.updateScaleHandler(scale),
      })),
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
