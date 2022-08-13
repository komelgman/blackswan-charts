export interface TextStyle {
  color: string;
  fontSize: number;
  fontFamily: string;
  fontStyle?: string;
}

export interface ChartStyle {
  text: TextStyle;
  backgroundColor: string;
  menuBackgroundColor: string;
  menuBackgroundColorOnHover: string;
  borderColor: string;
  resizeHandleColorOnHover: string;
}
