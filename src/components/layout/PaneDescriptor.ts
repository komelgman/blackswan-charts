import type { EntityId } from '@/model/tools/IdBuilder';

export declare type PaneId = EntityId;

export default interface PaneDescriptor<T> {
  id: PaneId;
  model: T;
  size?: number;
  // in fractions of a unit (1 - is 100% of multipane size, 0.1 - 10% of multipane size)
  preferredSize?: number;
  // absolute size in pixels
  minSize?: number;
  // absolute size in pixels; todo: deprecated
  maxSize?: number;
  visible: boolean;
}

export declare type PaneOptions<O> = {
  preferredSize?: number;
  minSize?: number;
  maxSize?: number;
  visible?: boolean;
} & O;
