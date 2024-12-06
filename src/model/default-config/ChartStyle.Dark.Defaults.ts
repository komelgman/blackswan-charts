import { type ChartStyle, Themes } from '@/model/chart/types/styles';
import { LineFillStyle } from '@/model/chart/types';

export const defaultFontFamily = '"Trebuchet MS", Roboto, Ubuntu, sans-serif';

export default {
  theme: Themes.DARK,
  backgroundColor: '#131722',
  borderColor: '#2a2e39',
  hoveredResizeHandleColor: '#b2b5be33',
  textStyle: {
    color: '#b2b5be',
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
    backgroundColor: '#1e222d',
    hoveredItemColor: '#2e323d',
  },
  viewport: {
    gridColor: '#1f212f',
  },
} as ChartStyle;
