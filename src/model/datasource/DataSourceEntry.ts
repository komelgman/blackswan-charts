import type Drawing from '@/model/datasource/Drawing';
import type { AxisMark, DrawingDescriptor } from '@/model/datasource/Drawing';

export declare type DataSourceEntry<DataType = any> = [DrawingDescriptor<DataType>, Drawing?, AxisMark?];
