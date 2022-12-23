import type { Point } from '@/model/type-defs';
import type { CSSProperties } from 'vue';

export declare type TextIcon = { type: 'text', text: string }
export declare type ImageIcon = { type: 'image', image: string }
export declare type MenuItemIcon = TextIcon | ImageIcon;

export declare type SimpleMenuItemModel = {
  type: 'item';
  title: string;
  style?: CSSProperties;
  onclick: CallableFunction;
  icon?: MenuItemIcon;
};

export declare type CheckboxMenuItemModel = {
  type: 'checkbox';
  title: string;
  checked: boolean;
  style?: CSSProperties;
  onclick: CallableFunction;
};

export declare type DividerMenuItemModel = { type: 'divider' };

export declare type MenuItem = DividerMenuItemModel | SimpleMenuItemModel | CheckboxMenuItemModel;

export interface ContextMenuOptionsProvider {
  contextmenu(pos: Point): MenuItem[];
}
