import type { EntityId } from '@/model/tools/IdBuilder';

export declare type PaneId = EntityId;

export default interface PaneDescriptor<T> {
  id: PaneId;
  model: T;
  size?: number;
  minSize?: number;
  maxSize?: number;
  visible?: boolean;
}

export declare type PaneOptions<O> = Omit<PaneDescriptor<never>, 'model' | 'id'> & O;
