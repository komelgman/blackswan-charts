import type { TextStyle } from '@/model/chart/types/styles';
import type { RectStyle } from '@/model/chart/types';

export interface ChartStyle {
  text: TextStyle;
  handleStyle: RectStyle;
  backgroundColor: string;
  menuBackgroundColor: string;
  menuBackgroundColorOnHover: string;
  borderColor: string;
  resizeHandleColorOnHover: string;
}
