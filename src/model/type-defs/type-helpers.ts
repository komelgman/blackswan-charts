export declare type Nominal<T, Name extends string> = T & { [Symbol.species]: Name; };
export declare type Wrapped<T> = { value: T };
export declare type Predicate<T> = (factor: T) => boolean;
export declare type Processor<T> = (value: T) => void;
