import type { PaneOptions } from '@/components/layout/types';
import type { DrawingOptions } from '@/model/datasource/types';
import type { ViewportOptions } from '@/model/chart/viewport/Viewport';

export declare type SerializedPane = {
  paneOptions: PaneOptions<ViewportOptions>;
  dataSource: {
    id: string;
    drawings: DrawingOptions[];
  };
};
