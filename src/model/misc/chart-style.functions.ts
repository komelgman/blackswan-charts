import { Themes, type ChartStyle, type ChartTheme } from '@/model/chart/types/styles';
import { clone } from '@/model/misc/object.clone';
import lightTheme from '@/model/default-config/ChartStyle.Light.Defaults';
import darkTheme from '@/model/default-config/ChartStyle.Dark.Defaults';

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
    result = clone(theme as ChartStyle);
  }

  return result;
}
