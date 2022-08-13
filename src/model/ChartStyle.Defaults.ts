import { ChartStyle } from '@/model/ChartStyle';

export const defaultFontFamily = '"Trebuchet MS", Roboto, Ubuntu, sans-serif';

export default {
  text: {
    color: '#b2b5be',
    fontFamily: defaultFontFamily,
    fontSize: 12,
    fontStyle: 'normal',
  },
  backgroundColor: '#131722',
  menuBackgroundColor: '#1e222d',
  menuBackgroundColorOnHover: '#2e323d',
  borderColor: '#2a2e39',
  resizeHandleColorOnHover: '#b2b5be33',
} as ChartStyle;
