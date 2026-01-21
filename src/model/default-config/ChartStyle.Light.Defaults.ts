import { type ChartStyle, Themes } from '@/model/chart/types/styles';
import { LineFillStyle } from '@/model/chart/types';

export const defaultFontFamily = '"Trebuchet MS", Roboto, Ubuntu, sans-serif';

export default {
  theme: Themes.LIGHT,
  backgroundColor: '#fafafa',
  borderColor: '#a3a0aa',
  hoveredResizeHandleColor: '#39334633',
  textStyle: {
    color: '#393346',
    fontFamily: defaultFontFamily,
    fontSize: 12,
    fontStyle: 'normal',
  },
  handleStyle: {
    color: '#101010',
    border: {
      lineWidth: 2,
      color: '#1010BB',
      fill: LineFillStyle.Solid,
    },
  },
  menu: {
    backgroundColor: '#f6f6f6',
    hoveredItemColor: '#efefef',
  },
  viewport: {
    gridColor: '#e2e2e3',
  },
} as ChartStyle;
