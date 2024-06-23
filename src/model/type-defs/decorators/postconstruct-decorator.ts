/* eslint-disable @typescript-eslint/no-explicit-any */
import type { HasPostConstruct } from 'src/model/type-defs/optional';

type Constructor<T> = new (...args: any[]) => T;

export function PostConstruct<T extends Record<string, any>>(ConstructorFunction: Constructor<T>): Constructor<T> {
  // eslint-disable-next-line func-names
  const newConstructor = function (...args: any[]): T {
    // eslint-disable-next-line func-names
    const ClassProxy = function (): T {
      const result: T = new ConstructorFunction(...args) satisfies T;

      if ((result as any as HasPostConstruct).postConstruct !== undefined) {
        result.postConstruct.apply(result);
      }

      return result;
    } as any as new() => T;

    ClassProxy.prototype = ConstructorFunction.prototype;
    return new ClassProxy();
  } as any as Constructor<T>;

  newConstructor.prototype = ConstructorFunction.prototype;

  return newConstructor;
}
