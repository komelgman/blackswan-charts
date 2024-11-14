import type { Nominal } from '@/model/type-defs';

export declare type UTCTimestamp = Nominal<number, 'UTCTimestamp'>;

export const enum TimePeriod {
  m1 = 1 * 60 * 1000,
  m5 = 5 * 60 * 1000,
  m15 = 15 * 60 * 1000,
  m30 = 30 * 60 * 1000,
  h1 = 60 * 60 * 1000,
  h4 = 4 * 60 * 60 * 1000,
  day = 24 * 60 * 60 * 1000,
  week = 7 * 24 * 60 * 60 * 1000,
  month = 'Month',
  year = 'Year',
}

// todo: refactor to timeUtil.forStep(step) => { barToTime(), timeToBar(), avgDuration, getDuration() }

const toTimeConverters: Map<TimePeriod, (from: UTCTimestamp, bar: number) => UTCTimestamp> = new Map([
  [TimePeriod.m1, (from, bar) => from + bar * TimePeriod.m1 as UTCTimestamp],
  [TimePeriod.m5, (from, bar) => from + bar * TimePeriod.m5 as UTCTimestamp],
  [TimePeriod.m15, (from, bar) => from + bar * TimePeriod.m15 as UTCTimestamp],
  [TimePeriod.m30, (from, bar) => from + bar * TimePeriod.m30 as UTCTimestamp],
  [TimePeriod.h1, (from, bar) => from + bar * TimePeriod.h1 as UTCTimestamp],
  [TimePeriod.h4, (from, bar) => from + bar * TimePeriod.h4 as UTCTimestamp],
  [TimePeriod.day, (from, bar) => from + bar * TimePeriod.day as UTCTimestamp],
  [TimePeriod.week, (from, bar) => from + bar * TimePeriod.week as UTCTimestamp],

  // todo: test it
  [TimePeriod.month, (from, bar) => {
    const date = new Date(from);
    date.setUTCMonth(date.getUTCMonth() + bar);
    return date.getTime() as UTCTimestamp;
  }],
  [TimePeriod.year, (from: UTCTimestamp, bar: number) => {
    const date = new Date(from);
    date.setUTCFullYear(date.getUTCFullYear() + bar);
    return date.getTime() as UTCTimestamp;
  }],
]);

const toBarConverters: Map<TimePeriod, (from: UTCTimestamp, time: UTCTimestamp) => number> = new Map([
  [TimePeriod.m1, (from, time) => (time - from) / TimePeriod.m1],
  [TimePeriod.m5, (from, time) => (time - from) / TimePeriod.m5],
  [TimePeriod.m15, (from, time) => (time - from) / TimePeriod.m15],
  [TimePeriod.m30, (from, time) => (time - from) / TimePeriod.m30],
  [TimePeriod.h1, (from, time) => (time - from) / TimePeriod.h1],
  [TimePeriod.h4, (from, time) => (time - from) / TimePeriod.h4],
  [TimePeriod.day, (from, time) => (time - from) / TimePeriod.day],
  [TimePeriod.week, (from, time) => (time - from) / TimePeriod.week],

  // todo: test it
  [TimePeriod.month, (from, time) => {
    const fromDate = new Date(from);
    const toDate = new Date(time);
    return (
      (toDate.getUTCFullYear() - fromDate.getUTCFullYear()) * 12
      + toDate.getUTCMonth() - fromDate.getUTCMonth()
      + (toDate.getUTCDate() < fromDate.getUTCDate() ? -1 : 0)
    );
  }],
  [TimePeriod.year, (from, time) => {
    const fromDate = new Date(from);
    const toDate = new Date(time);
    const correction = toDate.getUTCMonth() < fromDate.getUTCMonth()
    || (toDate.getUTCMonth() === fromDate.getUTCMonth() && toDate.getUTCDate() < fromDate.getUTCDate())
      ? -1
      : 0;
    return (
      toDate.getUTCFullYear() - fromDate.getUTCFullYear() + correction
    );
  }],
]);

export function barToTime(from: UTCTimestamp, bar: number, withStep: TimePeriod): UTCTimestamp {
  const converter = toTimeConverters.get(withStep);
  if (!converter) {
    throw new Error(`Ooops. Not supported time period: ${withStep}`);
  }

  return converter(from, bar);
}

export function timeToBar(from: UTCTimestamp, time: UTCTimestamp, withStep: TimePeriod): number {
  const converter = toBarConverters.get(withStep);
  if (!converter) {
    throw new Error(`Ooops. Not supported time period: ${withStep}`);
  }

  return converter(from, time);
}

export function getBarDuration(time: UTCTimestamp, step: TimePeriod): UTCTimestamp {
  switch (step) {
    case TimePeriod.m1:
    case TimePeriod.m5:
    case TimePeriod.m15:
    case TimePeriod.m30:
    case TimePeriod.h1:
    case TimePeriod.h4:
    case TimePeriod.day:
    case TimePeriod.week:
      return step as UTCTimestamp;

    case TimePeriod.month: {
      const date = new Date(time);
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));
      const daysInMonth = lastDayOfMonth.getUTCDate();

      return (daysInMonth * 24 * 60 * 60 * 1000) as UTCTimestamp;
    }

    case TimePeriod.year: {
      const date = new Date(time);
      const year = date.getUTCFullYear();
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      const daysInYear = isLeapYear ? 366 : 365;

      return (daysInYear * 24 * 60 * 60 * 1000) as UTCTimestamp;
    }

    default:
      throw new Error(`Unsupported time period: ${step}`);
  }
}

export function getBarDurationAvg(withStep: TimePeriod): UTCTimestamp {
  switch (withStep) {
    case TimePeriod.m1:
    case TimePeriod.m5:
    case TimePeriod.m15:
    case TimePeriod.m30:
    case TimePeriod.h1:
    case TimePeriod.h4:
    case TimePeriod.day:
    case TimePeriod.week:
      return withStep as UTCTimestamp;

    case TimePeriod.month: {
      return (30.44 * 24 * 60 * 60 * 1000) as UTCTimestamp; // average
    }

    case TimePeriod.year: {
      return (12 * 30.44 * 24 * 60 * 60 * 1000) as UTCTimestamp;
    }

    default:
      throw new Error(`Unsupported time period: ${withStep}`);
  }
}
