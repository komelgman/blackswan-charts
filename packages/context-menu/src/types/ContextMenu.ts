import type { MenuItem } from './ContextMenuOptions';

export declare type ContextMenu = {
  show: (event: MouseEvent, newItems: MenuItem[]) => void,
  hide: () => void
};
