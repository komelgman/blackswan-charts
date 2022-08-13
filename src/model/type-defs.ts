export const enum RegularTimePeriod {
  m1 = 1 * 60 * 1000,
  m5 = 5 * 60 * 1000,
  m15 = 15 * 60 * 1000,
  m30 = 30 * 60 * 1000,
  h1 = 60 * 60 * 1000,
  h4 = 4 * 60 * 60 * 1000,
  day = 24 * 60 * 60 * 1000,
  week = 7 * 24 * 60 * 60 * 1000,
}

export declare type Nominal<T, Name extends string> = T & { [Symbol.species]: Name; };
export declare type Wrapped<T> = { value: T };
export declare type Predicate<T> = (factor: T) => boolean;
export declare type Processor<T> = (value: T) => void;

export declare type NameTimedPeriod = 'Month' | 'Year';
export declare type TimePeriod = RegularTimePeriod | NameTimedPeriod;
export declare type UTCTimestamp = Nominal<number, 'UTCTimestamp'>;
export declare type Price = Nominal<number, 'Price'>;

export declare type Range<T> = { from: T, to: T };
export declare type Point = { x: number, y: number };
export declare type LogicSize = { main: number, second: number };
