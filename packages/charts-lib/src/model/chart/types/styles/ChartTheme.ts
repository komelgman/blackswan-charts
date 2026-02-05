import type { ChartStyle, Themes } from '@/model/chart/types/styles';

export declare type ChartTheme = Exclude<Themes, Themes.CUSTOM> | ChartStyle & { theme: Themes.CUSTOM };
