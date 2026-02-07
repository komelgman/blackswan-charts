import type { ContextMenuOptionsProvider } from '@blackswan/context-menu/types';
import type { PriceAxis } from '@/model/chart/axis/PriceAxis';
import type TimeAxis from '@/model/chart/axis/TimeAxis';
import type { InteractionsHandler } from '@/model/chart/user-interactions/InteractionsHandler';
import type { Viewport } from '@/model/chart/viewport/Viewport';

export interface ChartUserInteractions {
  get viewportInteractionsHandler(): InteractionsHandler<Viewport>;
  get timeAxisInteractionsHandler(): InteractionsHandler<TimeAxis>;
  get priceAxisInteractionsHandler(): InteractionsHandler<PriceAxis>;

  onKeyDown(e: KeyboardEvent): void;
  getPriceAxisContextMenu(priceAxis: PriceAxis): ContextMenuOptionsProvider;
  getTimeAxisContextMenu(timeAxis: TimeAxis): ContextMenuOptionsProvider;
  getViewportContextMenu(viewport: Viewport): ContextMenuOptionsProvider;
}
