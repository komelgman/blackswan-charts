import type { PaneOptions } from '@blackswan/layout/model';
import type { DrawingOptions } from '@/model/datasource/types';
import type { ViewportOptions } from '@/model/chart/viewport/Viewport';

export declare type SerializedPane = {
  paneOptions: PaneOptions<ViewportOptions>;
  dataSource: {
    id: string;
    drawings: DrawingOptions[];
  };
};
