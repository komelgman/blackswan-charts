import type { RectStyle } from '@/model/datasource/line/type-defs';

export interface TextStyle {
  color: string;
  fontSize: number;
  fontFamily: string;
  fontStyle?: string;
}

export interface ChartStyle {
  text: TextStyle;
  handleStyle: RectStyle;
  backgroundColor: string;
  menuBackgroundColor: string;
  menuBackgroundColorOnHover: string;
  borderColor: string;
  resizeHandleColorOnHover: string;
}
