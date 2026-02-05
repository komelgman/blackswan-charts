import type { Millisecons, UTCTimestamp } from '@/model/chart/types';
import { MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE, MS_PER_SECOND, TimePeriods, type TimePeriod } from './TimePeriod';
import { RegularTimePeriod, type LabelFormatter } from './RegularTimePeriod';
import { CentryTimePeriod } from './CentryTimePeriod';
import { YearTimePeriod } from './YearTimePeriod';
import { MonthTimePeriod } from './MonthTimePeriod';
import { DayTimePeriod } from './DayTimePeriod';

const { s1, s5, s15, s30, m1, m5, m15, m30, h1, h4, day, week, month, year, centry } = TimePeriods;
const HHMM_LABEL_FORMATTER: LabelFormatter = (t: UTCTimestamp) => {
  const date = new Date(t);
  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
};

const SS_LABEL_FORMATTER: LabelFormatter = (t: UTCTimestamp) => {
  const date = new Date(t);
  return `${String(date.getUTCSeconds()).padStart(2, '0')}s`;
};

const DAY_LABEL_FORMATTER: LabelFormatter = (t: UTCTimestamp) => {
  const date = new Date(t);
  return `${date.getUTCDate()}`;
};

let upPeriod = new CentryTimePeriod();
function build(f: () => TimePeriod): TimePeriod {
  upPeriod = f();
  return upPeriod;
}

export const TIME_PERIODS_MAP: Map<TimePeriods, TimePeriod> = new Map([
  [centry, upPeriod],
  [year, build(() => new YearTimePeriod(upPeriod))],
  [month, build(() => new MonthTimePeriod(upPeriod))],
  [week, build(() => new RegularTimePeriod(week, 7 * MS_PER_DAY as Millisecons, upPeriod, DAY_LABEL_FORMATTER))],
  [day, build(() => new DayTimePeriod(day, 1 * MS_PER_DAY as Millisecons, upPeriod, DAY_LABEL_FORMATTER))],
  [h4, build(() => new RegularTimePeriod(h4, 4 * MS_PER_HOUR as Millisecons, upPeriod, HHMM_LABEL_FORMATTER))],
  [h1, build(() => new RegularTimePeriod(h1, 1 * MS_PER_HOUR as Millisecons, upPeriod, HHMM_LABEL_FORMATTER))],
  [m30, build(() => new RegularTimePeriod(m30, 30 * MS_PER_MINUTE as Millisecons, upPeriod, HHMM_LABEL_FORMATTER))],
  [m15, build(() => new RegularTimePeriod(m15, 15 * MS_PER_MINUTE as Millisecons, upPeriod, HHMM_LABEL_FORMATTER))],
  [m5, build(() => new RegularTimePeriod(m5, 5 * MS_PER_MINUTE as Millisecons, upPeriod, HHMM_LABEL_FORMATTER))],
  [m1, build(() => new RegularTimePeriod(m1, 1 * MS_PER_MINUTE as Millisecons, upPeriod, HHMM_LABEL_FORMATTER))],
  [s30, build(() => new RegularTimePeriod(s30, 30 * MS_PER_SECOND as Millisecons, upPeriod, SS_LABEL_FORMATTER))],
  [s15, build(() => new RegularTimePeriod(s15, 15 * MS_PER_SECOND as Millisecons, upPeriod, SS_LABEL_FORMATTER))],
  [s5, build(() => new RegularTimePeriod(s5, 5 * MS_PER_SECOND as Millisecons, upPeriod, SS_LABEL_FORMATTER))],
  [s1, build(() => new RegularTimePeriod(s1, 1 * MS_PER_SECOND as Millisecons, upPeriod, SS_LABEL_FORMATTER))],
]);
