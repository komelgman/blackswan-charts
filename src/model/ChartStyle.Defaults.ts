import type { ChartStyle } from '@/model/ChartStyle';
import { LineFillStyle } from '@/model/type-defs';

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
  hloc: {
    candleStyle: {
      showBody: true,
      showBorder: true,
      showWick: true,
      bear: {
        wick: '#EF5350',
        body: '#EF5350',
        border: '#EF5350',
      },
      bull: {
        wick: '#26A29A',
        body: '#26A29A',
        border: '#26A29A',
      }
    }
  },
  backgroundColor: '#131722',
  menuBackgroundColor: '#1e222d',
  menuBackgroundColorOnHover: '#2e323d',
  borderColor: '#2a2e39',
  resizeHandleColorOnHover: '#b2b5be33',
} as ChartStyle;
