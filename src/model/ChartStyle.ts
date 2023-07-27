import type { RectStyle } from '@/model/type-defs';

export interface TextStyle {
  color: string;
  fontSize: number;
  fontFamily: string;
  fontStyle?: string;
}

export interface CandleColors {
  wick: string;
  body: string;
  border: string;
}

export interface CandleStyle extends Record<'bear' | 'bull', CandleColors> {
  showWick: boolean;
  showBody: boolean;
  showBorder: boolean;
}

export interface HLOCStyle {
  candleStyle: CandleStyle;
}

export interface ChartStyle {
  text: TextStyle;
  hloc: HLOCStyle;
  handleStyle: RectStyle;
  backgroundColor: string;
  menuBackgroundColor: string;
  menuBackgroundColorOnHover: string;
  borderColor: string;
  resizeHandleColorOnHover: string;
}
