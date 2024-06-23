import type { MenuItem } from '@/components/context-menu/types/ContextMenuOptions';

export declare type ContextMenu = {
  show: (event: MouseEvent, newItems: MenuItem[]) => void,
  hide: () => void
}
