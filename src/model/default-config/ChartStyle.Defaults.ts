import type { ChartStyle } from '@/model/chart/types/styles';
import { LineFillStyle } from '@/model/chart/types';

export const defaultFontFamily = '"Trebuchet MS", Roboto, Ubuntu, sans-serif';

export default {
  text: {
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
      fill:
      LineFillStyle.Solid,
    },
  },
  backgroundColor: '#131722',
  menuBackgroundColor: '#1e222d',
  menuBackgroundColorOnHover: '#2e323d',
  borderColor: '#2a2e39',
  resizeHandleColorOnHover: '#b2b5be33',
} as ChartStyle;
