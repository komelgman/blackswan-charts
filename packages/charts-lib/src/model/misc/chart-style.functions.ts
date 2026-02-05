import { Themes, type ChartStyle, type ChartTheme } from '@/model/chart/types/styles';
import { clone } from '@/model/misc/object.clone';
import { merge } from '@/model/misc/object.merge';
import lightTheme from '@/model/default-config/ChartStyle.Light.Defaults';
import darkTheme from '@/model/default-config/ChartStyle.Dark.Defaults';
import { makeFont } from '@/model/misc/function.makeFont';

export function getTheme(): Themes {
  if (typeof window === 'undefined') {
    return Themes.SYSTEM;
  }

  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  if (prefersDarkScheme.matches) {
    return Themes.DARK;
  }

  return Themes.LIGHT;
}

export function getThemeStyle(theme?: ChartTheme): ChartStyle {
  let result: ChartStyle = getTheme() === Themes.DARK ? clone(darkTheme) : clone(lightTheme);

  if (theme === Themes.DARK) {
    result = clone(darkTheme);
  } else if (theme === Themes.LIGHT) {
    result = clone(lightTheme);
  } else if ((theme as ChartStyle)?.theme === Themes.CUSTOM) {
    const custom = clone(theme as ChartStyle);
    merge(result, custom);
    result.theme = Themes.CUSTOM;
  }

  return result;
}

export type ChartCssVars = Record<string, string>;

export function getChartCssVars(style: ChartStyle): ChartCssVars {
  const {
    backgroundColor,
    borderColor,
    hoveredResizeHandleColor,
    textStyle,
    menu,
    viewport,
    priceAxis,
    timeAxis,
  } = style;

  const menuBackgroundColor = menu?.backgroundColor ?? backgroundColor;
  const menuBackgroundColorOnHover = menu?.hoveredItemColor ?? menuBackgroundColor;
  const viewportBackgroundColor = viewport?.backgroundColor;
  const priceAxisBackgroundColor = priceAxis?.backgroundColor;
  const timeAxisBackgroundColor = timeAxis?.backgroundColor;

  const fontStyle = textStyle.fontStyle ?? 'normal';
  const fontSize = `${textStyle.fontSize}px`;
  const fontFamily = textStyle.fontFamily;
  const font = makeFont(textStyle);

  const cssVars: ChartCssVars = {
    '--primary-background-color': backgroundColor,
    '--border-color': borderColor,
    '--resize-handle-color-on-hover': hoveredResizeHandleColor,
    '--menu-background-color': menuBackgroundColor,
    '--menu-background-color-on-hover': menuBackgroundColorOnHover,
    '--chart-text-color': textStyle.color,
    '--chart-font-family': fontFamily,
    '--chart-font-size': fontSize,
    '--chart-font-style': fontStyle,
    '--chart-font': font,
  };

  if (viewportBackgroundColor) {
    cssVars['--viewport-background-color'] = viewportBackgroundColor;
  }

  if (priceAxisBackgroundColor) {
    cssVars['--price-axis-background-color'] = priceAxisBackgroundColor;
  }

  if (timeAxisBackgroundColor) {
    cssVars['--time-axis-background-color'] = timeAxisBackgroundColor;
  }

  return cssVars;
}
