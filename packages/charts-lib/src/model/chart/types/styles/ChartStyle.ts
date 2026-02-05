import { Themes, type TextStyle } from '@/model/chart/types/styles';
import type { RectStyle } from '@/model/chart/types';

export interface ChartStyle {
  theme: Themes;
  textStyle: TextStyle;
  handleStyle: RectStyle;
  backgroundColor: string;
  borderColor: string;
  hoveredResizeHandleColor: string;
  menu: {
    backgroundColor: string;
    hoveredItemColor: string;
  }
  viewport: {
    gridColor: string;
    backgroundColor?: string;
  }
  priceAxis: {
    backgroundColor?: string;
  }
  timeAxis: {
    backgroundColor?: string;
  }
}
