import type { Range, UTCTimestamp } from '@/model/chart/types';
import type { ControlMode } from '@/model/chart/axis/types';
import type { DataSourceId, DrawingReference } from '@/model/datasource/types';

export declare type SerializedTimeAxis = {
  range: Range<UTCTimestamp>;
  controlMode: ControlMode;
  justfollow: boolean;
  primaryEntry: { dataSourceId?: DataSourceId, entryRef?: DrawingReference };
};
