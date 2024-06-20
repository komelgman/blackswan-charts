import type { TextStyle } from '@/model/TextStyle';
import type { RectStyle } from '@/model/type-defs';

export interface ChartStyle {
  text: TextStyle;
  handleStyle: RectStyle;
  backgroundColor: string;
  menuBackgroundColor: string;
  menuBackgroundColorOnHover: string;
  borderColor: string;
  resizeHandleColorOnHover: string;
}
