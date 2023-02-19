import type { EntityId } from '@/model/tools/IdBuilder';

export declare type PaneId = EntityId;

export default interface PaneDescriptor<T> {
  id: PaneId;
  model: T;
  initialSize?: number, // in fractions of a unit (1 - is 100% of multipane size, 0.1 - 10% of multipane size)
  size?: number;
  minSize?: number; // absolute size in pixels
  maxSize?: number; // absolute size in pixels
  visible?: boolean;
}

export declare type PaneOptions<O> = Omit<PaneDescriptor<never>, 'id' | 'model' | 'size'> & O;
