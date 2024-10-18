import type { Drawing, AxisMark, DrawingDescriptor } from '@/model/datasource/types';

export declare type DataSourceEntry<DataType = any> = {
  descriptor: DrawingDescriptor<DataType>,
  drawing?: Drawing,
  mark?: AxisMark, // todo: marks
};
