export declare type PaneId = string;

export default interface PaneDescriptor<T> {
  id: PaneId;
  model: T;
  size?: number;
  minSize?: number;
  maxSize?: number;
  visible?: boolean;
}

export declare type PaneOptions<O> = Omit<PaneDescriptor<never>, 'model'> & O;
export declare type PaneSizes = Omit<PaneDescriptor<never>, 'model' | 'id'>;
