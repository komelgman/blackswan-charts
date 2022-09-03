import Drawing, { AxisMark, DrawingOptions } from '@/model/datasource/Drawing';

export declare type DataSourceEntry<DataType = any> = [DrawingOptions<DataType>, Drawing?, AxisMark?];
